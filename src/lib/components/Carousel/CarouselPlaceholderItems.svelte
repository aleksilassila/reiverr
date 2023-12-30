<script lang="ts">
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	import { Container } from '../../actions/focusAction';
	export let size: 'dynamic' | 'md' | 'lg' = 'md';
	export let orientation: 'landscape' | 'portrait' = 'landscape';

	export let container: Container;
	let registerer = container.getRegisterer();
</script>

{#each Array(10) as _, i (i)}
	<div tabindex="0" use:registerer>
		<CardPlaceholder {size} index={i} {orientation} />
	</div>
{/each}
