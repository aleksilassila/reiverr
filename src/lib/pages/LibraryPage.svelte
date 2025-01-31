<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import { radarrApi } from '../apis/radarr/radarr-api';
	import { sonarrApi } from '../apis/sonarr/sonarr-api';
	import {
		tmdbApi,
		type TmdbMovie2,
		type TmdbMovieFull2,
		type TmdbSeries2
	} from '../apis/tmdb/tmdb-api';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import CardGrid from '../components/CardGrid.svelte';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import { scrollIntoView } from '../selectable';
	import { reiverrApiNew, sources, user } from '../stores/user.store';

	let availableTmdbItems: (TmdbMovie2 | TmdbSeries2)[] = [];
	const libraryItems = reiverrApiNew.users
		.getLibraryItems($user?.id as string)
		.then((r) =>
			Promise.all(
				r.data.items.map((i) =>
					i.mediaType === 'Movie'
						? tmdbApi
								.getTmdbMovie(Number(i.tmdbId))
								.then((movie) => ({ tmdbMovie: movie as TmdbMovieFull2, playStates: i.playStates }))
						: tmdbApi
								.getTmdbSeries(Number(i.tmdbId))
								.then((series) => ({ tmdbSeries: series as TmdbSeries2, playStates: i.playStates }))
				)
			).then((i) => i.filter((i) => ('tmdbMovie' in i ? !!i.tmdbMovie : !!i.tmdbSeries)))
		);

	$: console.log('libraryItems', libraryItems);

	$: indexableSources = $sources.filter((s) => s.capabilities.indexing).map((s) => s.source);

	async function updateAvailableItems() {
		const initialUpdate = availableTmdbItems.length === 0;
		const allItems: TmdbMovie2[] = [];

		console.log(get(sources), get(sources).length);

		await Promise.all(
			get(sources).map(async (s) => {
				if (s.capabilities.indexing) {
					const items: TmdbMovie2[] = await reiverrApiNew.sources
						.getSourceMovieIndex(s.source.id)
						.then((r) => r.data.items)
						.then((items) => {
							return Promise.all(items.map((item) => tmdbApi.getTmdbMovie(Number(item.id)))).then(
								(i) => i.filter((i) => !!i) as TmdbMovieFull2[]
							);
						});

					allItems.push(...items);
					if (initialUpdate) availableTmdbItems = [...availableTmdbItems, ...items];
				}
			})
		);

		if (!initialUpdate) availableTmdbItems = allItems;
	}

	const libraryItemsP = jellyfinApi.getLibraryItems();
	const sonarrDownloads: Promise<TmdbSeries2[]> = sonarrApi
		.getDownloads()
		.then((items) =>
			Promise.all(
				items
					.filter(
						(value, index, self) => index === self.findIndex((t) => t.seriesId === value.seriesId)
					)
					.map((i) => tmdbApi.getTmdbSeriesFromTvdbId(String(i.series.tvdbId)))
			).then((i) => i.filter((i) => !!i) as TmdbSeries2[])
		);
	let radarrDownloads: Promise<TmdbMovie2[]> = radarrApi
		.getDownloads()
		.then((items) =>
			Promise.all(items.map((i) => tmdbApi.getTmdbMovie(i.movie.tmdbId || -1))).then(
				(i) => i.filter((i) => !!i) as TmdbMovie2[]
			)
		);

	// settings.update((prev) => ({
	// 	...prev,
	// 	initialised: true,
	// 	jellyfin: {
	// 		...prev.jellyfin,
	// 		apiKey: import.meta.env.VITE_JELLYFIN_API_KEY,
	// 		baseUrl: import.meta.env.VITE_JELLYFIN_BASE_URL,
	// 		userId: import.meta.env.VITE_JELLYFIN_USER_ID
	// 	}
	// }));

	onMount(() => {
		updateAvailableItems();
	});
</script>

<DetachedPage class="py-16 space-y-8">
	<!-- {#await Promise.all([sonarrDownloads, radarrDownloads]) then [sonarrDownloads, radarrDownloads]}
		{#if sonarrDownloads?.length || radarrDownloads?.length}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Downloading</span>
				{#each sonarrDownloads as item}
					<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} group />
				{/each}

				{#each radarrDownloads as item}
					<TmdbCard on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {item} />
				{/each}
			</Carousel>
		{/if}
	{/await} -->
	<!-- <div class="px-32">
		<div class="mb-6">
			<div class="header2">Library</div>
		</div>
		<CardGrid>
			{#await libraryItemsP}
				<CarouselPlaceholderItems />
			{:then items}
				{#each items as item}
					<JellyfinCard
						{item}
						on:enter={scrollIntoView({ all: 64 })}
						size="dynamic"
						navigateWithType
					/>
				{/each}
			{/await}
		</CardGrid>
	</div> -->
	<div class="px-32">
		<div class="mb-6">
			<div class="header2">Available for streaming</div>
		</div>
		<CardGrid>
			<!-- {#await libraryItemsP}
				<CarouselPlaceholderItems />
			{:then items} -->
			{#each availableTmdbItems as item}
				<TmdbCard {item} on:enter={scrollIntoView({ all: 64 })} size="dynamic" navigateWithType />
			{/each}
			<!-- {/await} -->
		</CardGrid>
	</div>
	{#await libraryItems then items}
		<div class="px-32">
			<div class="mb-6">
				<div class="header2">My Library</div>
			</div>
			<CardGrid>
				<!-- {#await libraryItemsP}
				<CarouselPlaceholderItems />
			{:then items} -->
				{#each items as item}
					<TmdbCard
						item={'tmdbMovie' in item ? item.tmdbMovie : item.tmdbSeries}
						progress={item.playStates?.[0]?.progress || 0}
						on:enter={scrollIntoView({ all: 64 })}
						size="dynamic"
						navigateWithType
					/>
				{/each}
				<!-- {/await} -->
			</CardGrid>
		</div>
	{/await}
</DetachedPage>
