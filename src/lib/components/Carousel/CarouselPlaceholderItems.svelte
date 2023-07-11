<script lang="ts">
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	export let type: 'dynamic' | 'md' | 'large' = 'md';
</script>

{#each Array(10) as _, i (i)}
	<CardPlaceholder {type} />
{/each}
