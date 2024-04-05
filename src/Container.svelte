<svelte:options accessors />

<script lang="ts">
	import { onMount } from 'svelte';
	import { type NavigationActions, type FocusHandler, Selectable } from './lib/selectable';
	import classNames from 'classnames';

	export let name: string = '';
	export let direction: 'vertical' | 'horizontal' | 'grid' = 'vertical';
	export let gridCols: number = 0;
	export let focusOnMount = false;
	export let canFocusEmpty = true;
	export let trapFocus = false;
	export let debugOutline = false;
	export let handleFocus: FocusHandler = () => {};

	export let active = true;

	export let handleNavigateOut: NavigationActions = {};

	const { registerer, ...rest } = new Selectable(name)
		.setDirection(direction === 'grid' ? 'horizontal' : direction)
		.setGridColumns(gridCols)
		.setNavigationActions(handleNavigateOut)
		.setTrapFocus(trapFocus)
		.setCanFocusEmpty(canFocusEmpty)
		.setOnFocus(handleFocus)
		.getStores();
	export const container = rest.container;
	export const hasFocus = rest.hasFocus;
	export const hasFocusWithin = rest.hasFocusWithin;
	export const focusIndex = rest.focusIndex;

	export let tag = 'div';

	$: container.setIsActive(active);
	$: container.setGridColumns(gridCols);

	onMount(() => {
		rest.container._initializeSelectable();

		if (focusOnMount) {
			rest.container.focus();
		}

		return () => {
			rest.container._unmountContainer();
		};
	});
</script>

<svelte:element
	this={tag}
	on:click
	tabindex={active ? 0 : -1}
	{...$$restProps}
	class={classNames($$restProps.class, {
		'outline-none': debugOutline === false
	})}
	use:registerer
>
	<slot hasFocus={$hasFocus} hasFocusWithin={$hasFocusWithin} focusIndex={$focusIndex} />
</svelte:element>
