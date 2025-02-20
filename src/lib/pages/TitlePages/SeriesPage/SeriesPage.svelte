<script lang="ts">
	import Container from '$components/Container.svelte';
	import { tmdbApi } from '$lib/apis/tmdb/tmdb-api';
	import Button from '$lib/components/Button.svelte';
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import DetachedPage from '$lib/components/DetachedPage/DetachedPage.svelte';
	import HeroCarousel from '$lib/components/HeroCarousel/HeroCarousel.svelte';
	import TmdbPersonCard from '$lib/components/PersonCard/TmdbPersonCard.svelte';
	import { PLATFORM_WEB, TMDB_IMAGES_ORIGINAL } from '$lib/constants';
	import { scrollIntoView, useRegistrar } from '$lib/selectable';
	import { localSettings } from '$lib/stores/localstorage.store';
	import { useSeriesUserData } from '$lib/stores/media-user-data.store';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import { setUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import { formatThousands } from '$lib/utils';
	import { Bookmark, Check, ExternalLink, Minus, Play, Video } from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
	import type { TitleInfoProperty } from '../HeroTitleInfo';
	import TitleProperties from '../HeroTitleInfo.svelte';
	import EpisodeGrid from './EpisodeGrid.svelte';

	export let id: string;
	const tmdbId = Number(id);

	const {
		tmdbSeries,
		inLibrary,
		handleAddToLibrary,
		handleRemoveFromLibrary,
		nextEpisode,
		episodesUserData,
		handleAutoplay,
		handleOpenStreamSelector,
		canStream,
		isWatched,
		toggleIsWatched,
		unsubscribe
	} = useSeriesUserData(id);

	const { visibleStyle } = setUiVisibilityContext();
	const { registerScroll } = setScrollContext();

	$: recommendations = tmdbApi.getSeriesRecommendations(tmdbId);

	const episodeCards = useRegistrar();

	$: images = $tmdbSeries.then((series) => {
		const trailer = series?.videos?.results?.find(
			(video) => video.type === 'Trailer' && video.site === 'YouTube'
		)?.key;

		return (
			series?.images.backdrops
				?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
				?.map((bd, i) => ({
					backdropUrl: TMDB_IMAGES_ORIGINAL + bd.file_path || '',
					videoUrl: trailer && i === 0 ? trailer : undefined
				}))
				.slice(0, 5) || []
		);
	});

	let titleProperties: TitleInfoProperty[] = [];
	$tmdbSeries.then((series) => {
		const trailer = series?.videos?.results?.find(
			(video) => video.type === 'Trailer' && video.site === 'YouTube'
		)?.key;

		if (series && series.status !== 'Ended') {
			titleProperties.push({
				label: `Since ${new Date(series.first_air_date || Date.now())?.getFullYear()}`
			});
		} else if (series) {
			titleProperties.push({
				label: `Ended ${new Date(series.last_air_date || Date.now())?.getFullYear()}`
			});
		}

		if (series?.vote_average) {
			titleProperties.push({
				label: `${series.vote_average.toFixed(1)} TMDB (${formatThousands(
					series.vote_count ?? 0
				)})`,
				href: `https://www.themoviedb.org/tv/${id}`
			});
		}

		if (series?.genres) {
			titleProperties.push({
				label: series.genres.map((g) => g.name).join(', ')
			});
		}

		if ($localSettings.enableTrailers && trailer) {
			titleProperties.push({
				icon: Video,
				href: `https://www.youtube.com/watch?v=${trailer}`
			});
		}
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<DetachedPage let:handleGoBack let:registrar>
	<div class="relative" use:registerScroll>
		<Container
			class="h-[calc(100vh-4rem)] flex flex-col py-16 px-32"
			on:enter={scrollIntoView({ top: 0 })}
			on:navigate={({ detail }) => {
				if (detail.direction === 'down' && detail.willLeaveContainer) {
					$episodeCards?.focus();
					detail.preventNavigation();
				}
			}}
		>
			<HeroCarousel itemsP={images} autoFocusVideo>
				<Container />
				{#await $tmdbSeries then series}
					{#if series}
						<TitleProperties
							title={series.name ?? ''}
							properties={titleProperties}
							overview={series.overview ?? ''}
						/>
					{/if}
				{/await}
				<Container
					direction="horizontal"
					class="flex mt-8"
					focusOnMount
					on:back={handleGoBack}
					on:mount={registrar}
				>
					<Button
						class="mr-4"
						action={handleAutoplay}
						secondaryAction={handleOpenStreamSelector}
						disabled={!$canStream}
					>
						{#if $nextEpisode?.episode && $nextEpisode?.season}
							Play S{$nextEpisode?.season}E{$nextEpisode?.episode}
						{:else}
							Play
						{/if}
						<Play size={19} slot="icon" />
					</Button>

					{#if !$inLibrary}
						<Button class="mr-4" action={handleAddToLibrary} icon={Bookmark}>Add to Library</Button>
					{:else}
						<Button class="mr-4" action={handleRemoveFromLibrary} icon={Minus}>
							Remove from Library
						</Button>
					{/if}

					<Button class="mr-4" action={toggleIsWatched}>
						{#if $isWatched}
							Mark as Unwatched
						{:else}
							Mark as Watched
						{/if}
						<Check slot="icon" size={19} />
					</Button>

					{#if PLATFORM_WEB}
						<Button
							class="mr-4"
							on:clickOrSelect={() =>
								window.open(`https://www.themoviedb.org/tv/${tmdbId}`, '_blank')}
						>
							Open In TMDB
							<ExternalLink size={19} slot="icon-after" />
						</Button>
						<Button class="mr-4">
							Open In Jellyfin
							<ExternalLink size={19} slot="icon-after" />
						</Button>
					{/if}
				</Container>
			</HeroCarousel>
		</Container>
		<div class="relative z-10" style={$visibleStyle}>
			<EpisodeGrid
				on:enter={scrollIntoView({ top: -32, bottom: 128 })}
				on:mount={episodeCards.registrar}
				{tmdbId}
				tmdbSeries={$tmdbSeries}
				{nextEpisode}
				episodesUserData={$episodesUserData}
			/>
			<Container on:enter={scrollIntoView({ top: 0 })} class="pt-8">
				{#await $tmdbSeries then series}
					<Carousel scrollClass="px-32" class="mb-8">
						<div slot="header">Show Cast</div>
						{#each series?.aggregate_credits?.cast?.slice(0, 15) || [] as credit}
							<TmdbPersonCard on:enter={scrollIntoView({ horizontal: 128 })} tmdbCredit={credit} />
						{/each}
					</Carousel>
				{/await}
				{#await recommendations then recommendations}
					<Carousel scrollClass="px-32" class="mb-8">
						<div slot="header">Recommendations</div>
						{#each recommendations || [] as recommendation}
							<TmdbCard item={recommendation} on:enter={scrollIntoView({ horizontal: 128 })} />
						{/each}
					</Carousel>
				{/await}
			</Container>
			{#await $tmdbSeries then series}
				<Container class="flex-1 bg-secondary-950 pt-8 px-32" on:enter={scrollIntoView({ top: 0 })}>
					<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">More Information</h1>
					<div class="text-zinc-300 font-medium text-lg flex flex-wrap">
						<div class="flex-1">
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Created By</h2>
								{#each series?.created_by || [] as creator}
									<div>{creator.name}</div>
								{/each}
							</div>
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Network</h2>
								<div>{series?.networks?.[0]?.name}</div>
							</div>
						</div>
						<div class="flex-1">
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Language</h2>
								<div>{series?.spoken_languages?.[0]?.name}</div>
							</div>
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Last Air Date</h2>
								<div>{series?.last_air_date}</div>
							</div>
						</div>
					</div>
				</Container>
			{/await}
		</div>
	</div>
</DetachedPage>
