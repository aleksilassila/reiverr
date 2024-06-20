<script lang="ts">
	import { settings } from '../stores/settings.store';
	import CarouselPlaceholderItems from '../components/Carousel/CarouselPlaceholderItems.svelte';
	import { jellyfinApi } from '../apis/jellyfin/jellyfin-api';
	import CardGrid from '../components/CardGrid.svelte';
	import JellyfinCard from '../components/Card/JellyfinCard.svelte';
	import { scrollIntoView } from '../selectable';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import Carousel from '../components/Carousel/Carousel.svelte';
	import { sonarrApi } from '../apis/sonarr/sonarr-api';
	import { radarrApi } from '../apis/radarr/radarr-api';
	import Card from '../components/Card/Card.svelte';
	import type { ComponentProps } from 'svelte';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import { tmdbApi, type TmdbMovie2, type TmdbSeries2 } from '../apis/tmdb/tmdb-api';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';

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

	settings.update((prev) => ({
		...prev,
		initialised: true,
		jellyfin: {
			...prev.jellyfin,
			apiKey: import.meta.env.VITE_JELLYFIN_API_KEY,
			baseUrl: import.meta.env.VITE_JELLYFIN_BASE_URL,
			userId: import.meta.env.VITE_JELLYFIN_USER_ID
		}
	}));

	const displayedItems = writable([]);
	let currentIndex = 0;
	let allItems = [];

	const ITEMS_PER_ROW = 3;
	const ITEMS_PER_COLUMN = 4;
	const ITEMS_PER_PAGE = ITEMS_PER_ROW * ITEMS_PER_COLUMN;

	const loadMoreItems = () => {
		const nextIndex = currentIndex + ITEMS_PER_PAGE;
		const newItems = allItems.slice(currentIndex, nextIndex);
		if (newItems.length > 0) {
			displayedItems.update(curr => [...curr, ...newItems]);
			currentIndex = nextIndex;
		}
	};

	const observerCallback = (entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				loadMoreItems();
			}
		});
	};

	onMount(() => {
		const observer = new IntersectionObserver(observerCallback, {
			root: null,
			rootMargin: '0px',
			threshold: 1.0
		});
		const sentinel = document.querySelector('#sentinel');
		if (sentinel) {
			observer.observe(sentinel);
		}
		return () => {
			if (sentinel) {
				observer.unobserve(sentinel);
			}
		};
	});

	libraryItemsP.then(items => {
		allItems = items;
		loadMoreItems();
	});
</script>

<DetachedPage class="py-16 space-y-8">
	{#await Promise.all([sonarrDownloads, radarrDownloads]) then [sonarrDownloads, radarrDownloads]}
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
	{/await}
	<div class="px-32">
		<div class="mb-6">
			<div class="header2">Library</div>
		</div>
		<CardGrid>
			{#if $displayedItems.length === 0}
				<CarouselPlaceholderItems />
			{:else}
				{#each $displayedItems as item}
					<JellyfinCard
						{item}
						on:enter={scrollIntoView({ all: 64 })}
						size="dynamic"
						navigateWithType
					/>
				{/each}
			{/if}
		</CardGrid>
		<!-- Sentinel div for intersection observer -->
		<div id="sentinel" style="height: 1px;"></div>
	</div>
</DetachedPage>