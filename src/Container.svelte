<script lang="ts">
	import { onMount } from 'svelte';
	import { type NavigationActions, Selectable } from './lib/selectable';
	import classNames from 'classnames';

	export let name: string = '';
	export let horizontal = false;
	export let focusOnMount = false;
	export let debugOutline = false;

	export let active = true;

	export let navigationActions: NavigationActions = {};

	const { registerer, ...rest } = new Selectable(name)
		.setDirection(horizontal ? 'horizontal' : 'vertical')
		.setNavigationActions(navigationActions)
		.getStores();
	export const container = rest.container;
	export const hasFocus = rest.hasFocus;
	export const hasFocusWithin = rest.hasFocusWithin;
	export const focusIndex = rest.focusIndex;

	export let tag = 'div';

	$: container.setIsActive(active);

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
	<slot />
</svelte:element>
