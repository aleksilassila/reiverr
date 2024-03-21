<script lang="ts">
	import { onMount } from 'svelte';
	import { Selectable } from './lib/selectable';
	import classNames from 'classnames';

	export let name: string = '';
	export let horizontal = false;
	export let focusOnMount = false;
	export let debugOutline = false;

	const { registerer, ...rest } = new Selectable(name)
		.setDirection(horizontal ? 'horizontal' : 'vertical')
		.getStores();
	export const container = rest.container;
	export const hasFocus = rest.hasFocus;
	export const hasFocusWithin = rest.hasFocusWithin;
	export const focusIndex = rest.focusIndex;

	export let tag = 'div';

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
	tabindex="0"
	{...$$restProps}
	class={classNames($$restProps.class, {
		'outline-none': debugOutline === false
	})}
	use:registerer
>
	<slot />
</svelte:element>
