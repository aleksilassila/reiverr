<script>
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
</script>

{#each Array(10) as _, i (i)}
	<CardPlaceholder />
{/each}
