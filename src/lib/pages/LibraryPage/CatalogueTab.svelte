<script lang="ts">
	import type { MediaSource } from '$lib/apis/reiverr/reiverr.openapi';
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import Container from '$lib/components/Container.svelte';
	import { reiverrApi } from '$lib/stores/user.store';

	export let source: MediaSource;

	$: items = reiverrApi.sources.getMovieCatalogue(source.id).then((r) => r.data.items);
</script>

<Container>
	{#await items then items}
		<CardGrid>
			{#each items as item}
				<TmdbCard item={item} />
			{/each}
		</CardGrid>
	{/await}
</Container>
