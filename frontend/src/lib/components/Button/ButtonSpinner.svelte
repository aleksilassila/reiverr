<script lang="ts">
	import type { Snippet } from 'svelte';
	import Spinner from '../Utils/Spinner.svelte';

	interface Props {
		loading?: boolean;
		children?: Snippet;
		class?: string;
	}

	let { loading = false, children, class: className }: Props = $props();
</script>

<div class={className}>
	{#if loading}
		<Spinner />
	{:else}
		{@render children?.()}
	{/if}
</div>
