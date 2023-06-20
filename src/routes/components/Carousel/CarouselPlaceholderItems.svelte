<script>
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	export let large = false;
</script>

{#each Array(10) as _, i (i)}
	<CardPlaceholder {large} />
{/each}
