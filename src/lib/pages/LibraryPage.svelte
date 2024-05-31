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

	const libraryItemsP = jellyfinApi.getLibraryItems();
	let sonarrDownloads: Promise<ComponentProps<Card>[]> = sonarrApi.getDownloads().then((items) =>
		items
			.filter(
				(value, index, self) => index === self.findIndex((t) => t.seriesId === value.seriesId)
			)
			.map((i) => ({
				backdropUrl: i.series.images?.find((i) => i.coverType === 'poster')?.remoteUrl || '',
				group: true
			}))
	);
	let radarrDownloads: Promise<ComponentProps<Card>[]> = radarrApi.getDownloads().then((items) =>
		items.map((i) => ({
			backdropUrl: i.movie.images?.find((i) => i.coverType === 'poster')?.remoteUrl || ''
		}))
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
</script>

<DetachedPage class="py-16 space-y-8">
	{#await Promise.all([sonarrDownloads, radarrDownloads]) then [sonarrDownloads, radarrDownloads]}
		{#if sonarrDownloads?.length || radarrDownloads?.length}
			<Carousel scrollClass="px-32" on:enter={scrollIntoView({ vertical: 128 })}>
				<span slot="header">Downloading</span>
				{#each sonarrDownloads as props}
					<Card on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {...props} />
				{/each}

				{#each radarrDownloads as props}
					<Card on:enter={scrollIntoView({ horizontal: 128 })} size="lg" {...props} />
				{/each}
			</Carousel>
		{/if}
	{/await}
	<div class="px-32">
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
	</div>
</DetachedPage>
