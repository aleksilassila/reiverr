<script lang="ts">
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	export let type: 'dynamic' | 'normal' | 'large' = 'normal';
</script>

{#each Array(10) as _, i (i)}
	<CardPlaceholder {type} />
{/each}
