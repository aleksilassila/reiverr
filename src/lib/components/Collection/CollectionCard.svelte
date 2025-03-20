<script lang="ts">
	import Card from '../Card/Card.svelte';
	import LazyImg from '../LazyImg.svelte';
	import { navigate } from '../StackRouter/StackRouter';
	import type { Collection } from './collections';

	export let collection: Collection;
</script>

<Card
	orientation="landscape"
	on:clickOrSelect={() => navigate(`/collection/${collection.route}`)}
	alwaysShowTitle
	on:enter
	let:width
	let:height
>
	{#if collection.backdropUrl}
		<LazyImg src={collection.backdropUrl} class="absolute inset-0" {width} {height} />
	{/if}
	<h1
		class="relative z-10 flex-1 h3 bg-primary-800/50 flex items-center text-center p-4 line-clamp-2"
	>
		{collection.name}
	</h1>
</Card>
