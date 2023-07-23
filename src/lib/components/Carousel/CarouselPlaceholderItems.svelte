<script lang="ts">
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	export let size: 'dynamic' | 'md' | 'lg' = 'md';
</script>

{#each Array(10) as _, i (i)}
	<CardPlaceholder {size} />
{/each}
