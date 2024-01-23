<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, type FlowDirection } from './lib/actions/focusAction';

	export let name: string = '';
	export let direction: FlowDirection = 'vertical';

	const { registerer, ...rest } = new Container(name).setDirection(direction).getStores();
	export const container = rest.container;
	export const hasFocus = rest.hasFocus;
	export const hasFocusWithin = rest.hasFocusWithin;

	onMount(() => {
		rest.container._initializeContainer();
	});
</script>

<button use:registerer>
	<slot />
</button>
