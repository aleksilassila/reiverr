<script lang="ts">
	import ListRow from '$lib/components/ListRow.svelte';
	import RowCheckbox from '$lib/components/RowCheckbox.svelte';
	import { scrollIntoView, type Selectable } from '$lib/selectable';
	import { formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { ChevronDown, ChevronRight } from 'radix-icons-svelte';

	import type { LibraryNode } from './library-tree';

	interface Props {
		onToggle?: () => void;
		onExpand?: (detail: Selectable) => void;
		onCollapse?: (detail: Selectable) => void;
		node: LibraryNode;
		checked?: boolean;
		partiallyChecked?: boolean;
		expanded?: boolean;
	}

	let {
		node,
		checked = false,
		partiallyChecked = false,
		expanded = false,
		onToggle,
		onExpand,
		onCollapse
	}: Props = $props();

	let row: Selectable | undefined = $state();

	let isDirectory = $derived(node.entry.isDirectory);
	// An indexed file is managed by the cleanup or external, the rest is unknown to the server;
	// a managed file that no request holds goes at the next cleanup
	let requests = $derived(
		node.requests ? `${node.requests} ${node.requests === 1 ? 'request' : 'requests'} · ` : ''
	);
	let tag = $derived(
		node.entry.error
			? node.entry.error
			: node.entry.managed
				? !node.requests
					? 'Unretained'
					: `${requests}Managed`
				: node.entry.managed === false
					? `${requests}External`
					: ''
	);
</script>

<!-- Enter toggles the checkbox; right, or a click outside the checkbox, opens a directory and left
	closes the one the row is, or is in. With nothing to close, left leaves the tree. A click anywhere
	on a file toggles it -->
<div class="flex items-stretch">
	<!-- A line for every directory the row is in, outside the row, so that the lines meet -->
	{#each { length: node.depth } as _}
		<div class="flex-shrink-0 w-10 relative">
			<div class="absolute inset-y-0 left-3 divider-vertical"></div>
		</div>
	{/each}
	<ListRow
		class="flex-1 min-w-0 py-1"
		onEnter={scrollIntoView({ vertical: 96 })}
		onSelect={() => onToggle?.()}
		onMounted={(e) => (row = e)}
		onclick={() => (isDirectory ? row && onExpand?.(row) : onToggle?.())}
		onNavigate={(e) => {
			if (e.direction === 'right' && isDirectory) {
				e.preventNavigation();
				e.stopPropagation();
				if (row) onExpand?.(row);
			} else if (e.direction === 'left' && (expanded || node.depth > 0)) {
				e.preventNavigation();
				e.stopPropagation();
				onCollapse?.(e.selectable);
			}
		}}
	>
		{#snippet children({ hasFocus })}
			<!-- What a click opens, without the checkbox -->
			<div class="group/open flex-1 min-w-0 flex items-center pr-6">
				{#if isDirectory}
					{@const SvelteComponent = expanded ? ChevronDown : ChevronRight}
					<div
						class={classNames(
							'flex-shrink-0 w-6 flex items-center mr-1 group-hover/open:text-primary-500',
							{
								'text-primary-500': hasFocus
							}
						)}
					>
						<SvelteComponent size={24} />
					</div>
				{/if}
				<div
					class={classNames('flex-1 min-w-0 flex items-center text-xl font-semibold', {
						'group-hover/open:text-primary-500': isDirectory,
						'text-primary-500': isDirectory && hasFocus
					})}
				>
					<span class="line-clamp-1">{node.name}</span>
				</div>
				{#if tag}
					<div
						class={classNames(
							'flex-shrink-0 flex items-center ml-4 text-base font-medium',
							node.entry.error ? 'text-red-400' : 'text-secondary-400'
						)}
					>
						{tag}
					</div>
				{/if}
				<div
					class="flex-shrink-0 flex items-center justify-end ml-4 w-28 text-lg font-medium text-secondary-300"
				>
					{formatSize(node.size)}
				</div>
			</div>
			<div class="flex-shrink-0 flex items-center">
				<RowCheckbox
					{checked}
					{partiallyChecked}
					{hasFocus}
					rowToggles={!isDirectory}
					size="sm"
					{onToggle}
				/>
			</div>
		{/snippet}
	</ListRow>
</div>
