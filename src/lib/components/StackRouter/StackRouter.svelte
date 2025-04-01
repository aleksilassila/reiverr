<script lang="ts">
	import { derived } from 'svelte/store';
	import { type StackRouterStore } from './StackRouter';
	import Sidebar from '../Sidebar/Sidebar.svelte';
	import StackRouterPage from './StackRouterPage.svelte';

	export let stack: StackRouterStore;
	const topComponent = derived(stack, ($stack) => $stack[$stack.length - 1]);
</script>

<svelte:window on:popstate={stack.handlePopState} />

{#if $topComponent?.route.sidebar !== false}
	<Sidebar />
{/if}

{#each $stack as page, index (page.id)}
	{@const topmost = index === $stack.length - 1}
	<StackRouterPage hidden={!topmost} hasSidebar={page.route.sidebar !== false}>
		<svelte:component this={page.route.component} {...page.props} />
	</StackRouterPage>
{/each}
