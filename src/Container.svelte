<script lang="ts">
	import { onMount } from 'svelte';
	import { Container } from './lib/actions/focusAction';

	export let name: string = '';
	export let horizontal = false;

	const { registerer, ...rest } = new Container(name)
		.setDirection(horizontal ? 'horizontal' : 'vertical')
		.getStores();
	export const container = rest.container;
	export const hasFocus = rest.hasFocus;
	export const hasFocusWithin = rest.hasFocusWithin;

	export let tag = 'div';

	onMount(() => {
		rest.container._initializeContainer();

		return () => {
			rest.container._unmountContainer();
		};
	});
</script>

<svelte:element this={tag} on:click tabindex="0" {...$$restProps} use:registerer>
	<slot />
</svelte:element>
