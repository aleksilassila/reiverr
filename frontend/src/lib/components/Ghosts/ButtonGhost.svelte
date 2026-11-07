<script lang="ts">
	import type { Snippet } from 'svelte';
	import Container from '../Container.svelte';
	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<Container
	class="px-6 py-2 rounded-lg font-medium tracking-wide flex items-center bg-stone-600/50 animate-pulse"
>
	<div class="opacity-0">
		{#if children}{@render children()}{:else}Loading...{/if}
	</div>
</Container>
