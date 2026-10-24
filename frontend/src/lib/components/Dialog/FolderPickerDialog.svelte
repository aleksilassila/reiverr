<script lang="ts">
	import type { DirectoryListingDto } from '$lib/apis/reiverr/reiverr.openapi';
	import { scrollIntoView } from '$lib/selectable';
	import { formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { ChevronRight, Link2 } from 'radix-icons-svelte';
	import { reiverrApi } from '../../stores/user.store';
	import Button from '../Button/Button.svelte';
	import Container from '../Container.svelte';
	import ListRow from '../ListRow.svelte';
	import { createModal } from '../Modal/modal.store';
	import { useComponentStack } from '../StackRouter/stack-router.store';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import Dialog from './Dialog.svelte';

	const { close } = useComponentStack();

	export let title: string;
	/** Where the picker opens */
	export let path = '/';
	/** Folders that cannot be picked, by path, with why */
	export let disabled: Record<string, string> = {};
	/** Gets the picked folder. The picker closes when it resolves and shows what it rejects with */
	export let onSelect: (path: string) => Promise<unknown>;

	let listing: DirectoryListingDto | undefined = undefined;
	let error = '';
	let loads = 0;

	const errorMessage = (e: any): string => e?.response?.data?.message ?? e?.message ?? String(e);

	/** One level at a time: entering a folder loads what is in it */
	async function load(next: string) {
		const id = ++loads;
		error = '';

		const result = await reiverrApi.server
			.getDirectories({ path: next })
			.then((r) => r.data)
			.catch((e) => errorMessage(e));
		// Another folder was entered in the meantime
		if (id !== loads) return;

		if (typeof result === 'string') error = result;
		else listing = result;
	}

	load(path);

	function goUp() {
		if (listing?.parent) load(listing.parent);
	}

	function pick(folder: string) {
		if (disabled[folder]) return;

		createModal(ConfirmDialog, {
			header: 'Add the folder?',
			body: folder,
			confirm: () =>
				onSelect(folder).then(
					() => close(),
					(e) => (error = errorMessage(e))
				)
		});
	}
</script>

<!-- Enter picks the focused folder, right enters it and left goes to the parent. A click enters a
	folder; the Select button of the focused or hovered row picks it -->
<Dialog size="lg">
	<div class="flex-shrink-0 mb-4">
		<h1 class="h4 mb-1">{title}</h1>
		{#if listing}
			<div class="flex items-center justify-between font-medium text-secondary-300">
				<span class="line-clamp-1 min-w-0 mr-4">{listing.path}</span>
				{#if listing.disk}
					<span class="flex-shrink-0">
						{formatSize(listing.disk.freeBytes)} free of {formatSize(listing.disk.totalBytes)}
					</span>
				{/if}
			</div>
		{:else if !error}
			<p class="text-secondary-400">Loading...</p>
		{/if}
	</div>
	{#if error}
		<p class="flex-shrink-0 error mb-4">{error}</p>
	{/if}
	{#if listing}
		{#key listing.path}
			<!-- The list scrolls inside the dialog, which is capped at the height of the window -->
			<div
				class="flex-1 min-h-0 overflow-y-auto scrollbar-hide"
				style="backface-visibility: hidden;"
			>
				<Container class="flex flex-col">
					{#if listing.parent}
						<!-- The first folder takes the focus; .. only when there is none -->
						<ListRow
							focusOnMount={!listing.entries.length}
							on:enter={scrollIntoView({ vertical: 96 })}
							on:select={goUp}
							on:click={goUp}
							on:navigate={({ detail }) => {
								if (detail.direction === 'left') {
									detail.preventNavigation();
									detail.stopPropagation();
									goUp();
								}
							}}
						>
							<span class="flex-1 text-xl font-semibold">..</span>
						</ListRow>
					{/if}
					{#each listing.entries as entry, index (entry.path)}
						{@const reason = disabled[entry.path]}
						<ListRow
							focusOnMount={index === 0}
							on:enter={scrollIntoView({ vertical: 96 })}
							on:select={() => pick(entry.path)}
							on:click={() => load(entry.path)}
							on:navigate={({ detail }) => {
								if (detail.direction === 'right') {
									detail.preventNavigation();
									detail.stopPropagation();
									load(entry.path);
								} else if (detail.direction === 'left' && listing?.parent) {
									detail.preventNavigation();
									detail.stopPropagation();
									goUp();
								}
							}}
							let:hasFocus
						>
							<div
								class={classNames('flex-1 min-w-0 flex items-center', {
									'opacity-40': reason
								})}
							>
								<ChevronRight
									size={24}
									class={classNames('flex-shrink-0 mr-1', { 'text-primary-500': hasFocus })}
								/>
								<span
									class={classNames('line-clamp-1 text-xl font-semibold', {
										'text-primary-500': hasFocus
									})}
								>
									{entry.name}
								</span>
								{#if entry.isSymbolicLink}
									<Link2 size={20} class="flex-shrink-0 ml-2 text-secondary-400" />
								{/if}
								{#if reason}
									<span class="flex-shrink-0 ml-4 text-base font-medium text-secondary-400">
										{reason}
									</span>
								{/if}
							</div>
							{#if !reason}
								<!-- Not focusable, enter on the row picks. A click on the button is the button's, not the row's -->
								<Button
									type="secondary"
									size="sm"
									selectableDisabled
									class={classNames(
										'flex-shrink-0 ml-4',
										hasFocus ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
									)}
									on:click={({ detail }) => detail.stopPropagation()}
									on:clickOrSelect={() => pick(entry.path)}
								>
									Select
								</Button>
							{/if}
						</ListRow>
					{/each}
					{#if !listing.entries.length}
						<p class="px-6 py-2.5 text-secondary-400">No folders</p>
					{/if}
				</Container>
			</div>
		{/key}
	{/if}
</Dialog>
