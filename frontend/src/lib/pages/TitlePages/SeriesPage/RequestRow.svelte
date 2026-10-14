<script lang="ts">
	import ListRow from '$lib/components/ListRow.svelte';
	import classNames from 'classnames';
	import { Check, ChevronRight, Minus } from 'radix-icons-svelte';
	import { createEventDispatcher } from 'svelte';

	export let title: string;
	export let subtitle = '';
	export let subtitleDimmed = false;
	export let status = '';
	export let isError = false;
	export let checked = false;
	export let partiallyChecked = false;
	export let heading = false;

	const dispatch = createEventDispatcher<{ toggle: null; open: null }>();
</script>

<!-- Enter toggles the checkbox; right, or a click outside the checkbox, opens the row -->
<ListRow
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
	<div class={classNames('flex-1 min-w-0 ml-4', { 'text-secondary-100': heading })}>
		<div class={classNames('font-semibold line-clamp-1', heading ? 'text-2xl' : 'text-3xl')}>
			{title}
		</div>
		{#if subtitle}
			<div class="text-base font-medium line-clamp-1 mt-1">
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
