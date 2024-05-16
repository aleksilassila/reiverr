<script lang="ts">
	import { type StackRouterStore } from './StackRouter';

	export let stack: StackRouterStore;
</script>

<svelte:window on:popstate={stack.handlePopState} />

{#each $stack as page, index (page.id)}
	<svelte:component
		this={page.route.component}
		{...page.props}
		topmost={index === $stack.length - 1}
	/>
{/each}
