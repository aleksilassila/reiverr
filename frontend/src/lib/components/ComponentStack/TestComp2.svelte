<script lang="ts">
	import { getContext, hasContext, setContext } from 'svelte';
	import ComponentStackContainer2 from './ComponentStackContainer.svelte';
	import type { ComponentStackStore } from '$lib/stores/component-stack.store';
	import TestComp from './TestComp.svelte';

	const componentStack = getContext<ComponentStackStore>('component-stack');

	const test = hasContext('test') ? getContext<number>('test') : 0;
	setContext('test', test + 1);
</script>

<ComponentStackContainer2>
	<div>Test Component {test}</div>
	<button on:click={() => componentStack.push({ component: TestComp, props: {} })}>
		ANOTHER ONE
	</button>
</ComponentStackContainer2>
