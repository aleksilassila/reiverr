<script lang="ts">
	import classNames from 'classnames';
	import { Check, Minus } from 'radix-icons-svelte';
	import { createEventDispatcher } from 'svelte';

	/**
	 * The checkbox of a row that is the focusable unit itself, such as a ListRow: not focusable,
	 * drawn after the focus of the row. Yellow while the row has focus or the box is hovered.
	 */

	export let checked = false;
	export let partiallyChecked = false;
	/** The focus of the row */
	export let hasFocus = false;
	/** Whether a click anywhere on the row toggles the box, so that hovering the row (the nearest `group`) highlights it too */
	export let rowToggles = false;
	export let size: 'md' | 'sm' = 'md';

	const dispatch = createEventDispatcher<{ toggle: null }>();

	$: iconSize = size === 'md' ? 20 : 18;
</script>

<!-- A click on the box is the box's, not the row's -->
<div
	class={classNames(
		'flex-shrink-0 border-2 rounded-lg flex items-center justify-center transition-colors',
		{
			'w-8 h-8': size === 'md',
			'w-7 h-7': size === 'sm',
			'border-primary-500 bg-primary-500/20 text-primary-500':
				(checked || partiallyChecked) && hasFocus,
			'border-secondary-100 bg-secondary-200/20 text-secondary-100 hover:border-primary-500 hover:bg-primary-500/20 hover:text-primary-500':
				(checked || partiallyChecked) && !hasFocus,
			'group-hover:border-primary-500 group-hover:bg-primary-500/20 group-hover:text-primary-500':
				(checked || partiallyChecked) && !hasFocus && rowToggles,
			'border-secondary-500 hover:border-primary-500': !checked && !partiallyChecked && !hasFocus,
			'group-hover:border-primary-500': !checked && !partiallyChecked && !hasFocus && rowToggles,
			'border-primary-500': !checked && !partiallyChecked && hasFocus
		}
	)}
	on:click|stopPropagation={() => dispatch('toggle')}
	on:keypress={() => {
		/* For a11y */
	}}
>
	{#if checked}
		<Check size={iconSize} />
	{:else if partiallyChecked}
		<Minus size={iconSize} />
	{/if}
</div>
