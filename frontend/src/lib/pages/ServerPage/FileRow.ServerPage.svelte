<script lang="ts">
	import ListRow from '$lib/components/ListRow.svelte';
	import { scrollIntoView, type Selectable } from '$lib/selectable';
	import { formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { Check, ChevronDown, ChevronRight, Minus } from 'radix-icons-svelte';
	import { createEventDispatcher } from 'svelte';
	import type { LibraryNode } from './library-tree';

	export let node: LibraryNode;
	export let checked = false;
	export let partiallyChecked = false;
	export let expanded = false;

	const dispatch = createEventDispatcher<{
		toggle: null;
		expand: Selectable;
		collapse: Selectable;
	}>();

	let row: Selectable;

	$: isDirectory = node.entry.isDirectory;
	// An indexed file is managed by the cleanup or external, the rest is unknown to the server
	$: requests = node.requests
		? `${node.requests} ${node.requests === 1 ? 'request' : 'requests'} · `
		: '';
	$: tag = node.entry.error
		? node.entry.error
		: node.entry.managed
			? `${requests}Managed`
			: node.entry.managed === false
				? `${requests}External`
				: '';
</script>

<!-- Enter toggles the checkbox; right, or a click outside the checkbox, opens a directory and left
	closes the one the row is, or is in. With nothing to close, left leaves the tree -->
<div class="flex items-stretch">
	<!-- A line for every directory the row is in, outside the row, so that the lines meet -->
	{#each { length: node.depth } as _}
		<div class="flex-shrink-0 w-10 relative">
			<div class="absolute inset-y-0 left-3 divider-vertical" />
		</div>
	{/each}
	<ListRow
		class="flex-1 min-w-0 py-1"
		on:enter={scrollIntoView({ vertical: 96 })}
		on:select={() => dispatch('toggle')}
		on:mount={({ detail }) => (row = detail)}
		on:click={() => (isDirectory ? dispatch('expand', row) : dispatch('toggle'))}
		on:navigate={({ detail }) => {
			if (detail.direction === 'right' && isDirectory) {
				detail.preventNavigation();
				detail.stopPropagation();
				dispatch('expand', row);
			} else if (detail.direction === 'left' && (expanded || node.depth > 0)) {
				detail.preventNavigation();
				detail.stopPropagation();
				dispatch('collapse', detail.selectable);
			}
		}}
	>
		{#if isDirectory}
			<div class="flex-shrink-0 w-6 flex items-center mr-1">
				<svelte:component this={expanded ? ChevronDown : ChevronRight} size={24} />
			</div>
		{/if}
		<div class="flex-1 min-w-0 flex items-center text-xl font-semibold">
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
		<div class="flex-shrink-0 flex items-center ml-6">
			<div
				class={classNames(
					'border-2 rounded-lg w-7 h-7 flex items-center justify-center transition-colors',
					{
						'border-primary-500 bg-primary-500 text-secondary-800': checked,
						'border-primary-500 bg-primary-500/30 text-primary-300': partiallyChecked && !checked,
						'border-secondary-500 hover:border-primary-500': !checked && !partiallyChecked
					}
				)}
				on:click|stopPropagation={() => dispatch('toggle')}
				on:keypress={() => {
					/* For a11y */
				}}
			>
				{#if checked}
					<Check size={18} />
				{:else if partiallyChecked}
					<Minus size={18} />
				{/if}
			</div>
		</div>
	</ListRow>
</div>
