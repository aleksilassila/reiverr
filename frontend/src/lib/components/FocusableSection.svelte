<script lang="ts">
	import type { Snippet } from 'svelte';
	import Container from './Container.svelte';
	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<Container>
	<h1>Title</h1>
	{@render children?.()}
</Container>
