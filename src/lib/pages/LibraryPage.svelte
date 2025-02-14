<script lang="ts">
	import { libraryItemsDataStore } from '$lib/stores/data.store';
	import { onMount } from 'svelte';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import { radarrApi } from '../apis/radarr/radarr-api';
	import { sonarrApi } from '../apis/sonarr/sonarr-api';
	import { tmdbApi, type TmdbMovie2, type TmdbSeries2 } from '../apis/tmdb/tmdb-api';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import CardGrid from '../components/CardGrid.svelte';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import { scrollIntoView } from '../selectable';

	const { promise: libraryItems } = libraryItemsDataStore.subscribe();
</script>

<DetachedPage class="py-16 space-y-8">
	{#await $libraryItems then items}
		<div class="px-32">
			<div class="mb-6">
				<div class="h3">My Library</div>
			</div>
			<CardGrid>
				{#each items as item}
					<TmdbCard
						item={item.metadata}
						progress={item.playStates?.[0]?.progress || 0}
						on:enter={scrollIntoView({ all: 64 })}
						size="dynamic"
						navigateWithType
					/>
				{/each}
			</CardGrid>
		</div>
	{/await}
</DetachedPage>
