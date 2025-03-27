<script lang="ts">
	import type { MediaSourceDto } from '$lib/apis/reiverr/reiverr.openapi';
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import Container from '$lib/components/Container.svelte';
	import { reiverrApi } from '$lib/stores/user.store';

	export let source: MediaSourceDto;

	$: items = reiverrApi.sources.getMovieCatalogue(source.id).then((r) => r.data.items);
</script>

<Container class="mx-32">
	{#await items then items}
		<CardGrid>
			{#each items.map((i) => i.tmdbItem) as item}
				<TmdbCard {item} />
			{/each}
		</CardGrid>
	{/await}
</Container>
