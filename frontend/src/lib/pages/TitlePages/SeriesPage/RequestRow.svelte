<script lang="ts">
	import ListRow from '$lib/components/ListRow.svelte';
	import classNames from 'classnames';
	import { Check, ChevronRight, Minus } from 'radix-icons-svelte';
	import { createEventDispatcher } from 'svelte';

	export let title = '';
	export let subtitle = '';
	export let subtitleDimmed = false;
	export let status = '';
	export let isError = false;
	export let checked = false;
	export let partiallyChecked = false;

	const dispatch = createEventDispatcher<{ toggle: null; open: null }>();
</script>

<!-- Enter toggles the checkbox; right, or a click outside the checkbox, opens the row -->
<ListRow
	on:mount
	on:enter
	on:select={() => dispatch('toggle')}
	on:click={() => dispatch('open')}
	on:navigate={({ detail }) => {
		if (detail.direction === 'right') {
			detail.preventNavigation();
			detail.stopPropagation();
			dispatch('open');
		}
	}}
	let:hasFocus
>
	<div
		class={classNames(
			'flex-shrink-0 border-2 rounded-lg w-8 h-8 flex items-center justify-center transition-colors',
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
			<Check size={20} />
		{:else if partiallyChecked}
			<Minus size={20} />
		{/if}
	</div>
	<div class="flex-1 min-w-0 ml-4">
		<div class="text-2xl font-semibold line-clamp-1">
			{#if title}
				{title}
			{:else}
				<slot />
			{/if}
		</div>
		{#if subtitle}
			<div
				class={classNames('text-lg font-medium line-clamp-1 mt-1', {
					'text-secondary-400': subtitleDimmed,
					'text-secondary-200': !subtitleDimmed
				})}
			>
				{subtitle}
			</div>
		{/if}
	</div>
	{#if status}
		<div
			class={classNames(
				'flex-shrink-0 ml-4 max-w-md line-clamp-1 text-lg font-medium',
				isError ? 'text-red-400' : 'text-secondary-300'
			)}
		>
			{status}
		</div>
	{/if}
	<ChevronRight
		size={24}
		class={classNames('flex-shrink-0 ml-2 group-hover:opacity-100', { 'opacity-0': !hasFocus })}
	/>
</ListRow>
