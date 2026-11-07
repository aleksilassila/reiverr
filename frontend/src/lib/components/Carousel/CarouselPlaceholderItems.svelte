<script lang="ts">
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	import Container from '../Container.svelte';
	interface Props {
		size?: 'dynamic' | 'md' | 'lg';
		orientation?: 'landscape' | 'portrait';
	}

	let { size = 'md', orientation = 'landscape' }: Props = $props();
</script>

{#each Array(10) as _, i (i)}
	<Container>
		<CardPlaceholder {size} index={i} {orientation} />
	</Container>
{/each}
