<script lang="ts">
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	import Container from '../Container.svelte';
	export let size: 'dynamic' | 'md' | 'lg' = 'md';
	export let orientation: 'landscape' | 'portrait' = 'landscape';
</script>

{#each Array(10) as _, i (i)}
	<Container>
		<CardPlaceholder {size} index={i} {orientation} />
	</Container>
{/each}
