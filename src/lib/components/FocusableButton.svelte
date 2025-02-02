<script lang="ts">
	import { onMount } from 'svelte';
	import { Selectable, type FlowDirection } from '../selectable';

	export let name: string = '';
	export let direction: FlowDirection = 'vertical';

	const { registerer, ...rest } = new Selectable(name).setDirection(direction).getStores();
	export const container = rest.container;
	export const hasFocus = rest.hasFocus;
	export const hasFocusWithin = rest.hasFocusWithin;

	onMount(() => {
		rest.container._mountSelectable();
	});
</script>

<button use:registerer>
	<slot />
</button>
