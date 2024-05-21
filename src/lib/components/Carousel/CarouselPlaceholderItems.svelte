<script lang="ts">
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	export let size: 'dynamic' | 'md' | 'lg' = 'md';
	export let orientation: 'landscape' | 'portrait' = 'landscape';
</script>

{#each Array(10) as _, i (i)}
	<CardPlaceholder {size} index={i} {orientation} />
{/each}
