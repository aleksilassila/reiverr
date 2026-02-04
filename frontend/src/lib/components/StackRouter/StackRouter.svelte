<script lang="ts">
	import type { StackRouterStore } from './stack-router.store';
	import StackRouterPage from './StackRouterPage.svelte';

	export let stack: StackRouterStore;
</script>

<svelte:window on:popstate={stack.handlePopState} />

{#each $stack as page, index (page.id)}
	{@const nextPage = $stack[index + 1]}
	{@const lastPage = $stack[$stack.length - 1]}
	{@const isHidden = nextPage?.group === page.group || lastPage?.pages !== page.pages}
	<StackRouterPage {page} {isHidden} />
{/each}
