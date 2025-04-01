<script lang="ts">
	import Container from '$components/Container.svelte';
	import { tmdbApi } from '$lib/apis/tmdb/tmdb-api';
	import Button from '$lib/components/Button.svelte';
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import { createBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import HeroCarousel from '$lib/components/HeroShowcase/HeroCarousel.svelte';
	import TmdbPersonCard from '$lib/components/PersonCard/TmdbPersonCard.svelte';
	import { getStackRouterPage } from '$lib/components/StackRouter/StackRouter';
	import { PLATFORM_WEB, TMDB_IMAGES_ORIGINAL } from '$lib/constants';
	import { scrollIntoView } from '$lib/selectable';
	import { localSettings } from '$lib/stores/localstorage.store';
	import { useMovieUserData } from '$lib/stores/media-user-data.store';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import { setUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import { formatMinutesToTime, formatThousands } from '$lib/utils';
	import { Bookmark, Check, ExternalLink, Minus, Play, Video } from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
	import type { TitleInfoProperty } from '../HeroTitleInfo';
	import HeroTitleInfo from '../HeroTitleInfo.svelte';

	export let id: string;
	const { registrar } = getStackRouterPage();

	const tmdbId = Number(id);
	const background = createBackgroundPage({ backgroundMediaId: id, videoMediaId: id });
	const {
		tmdbMovie,
		inLibrary,
		progress,
		handleAddToLibrary,
		handleRemoveFromLibrary,
		handleAutoplay,
		handleOpenStreamSelector,
		canStream,
		isWatched,
		toggleIsWatched,
		unsubscribe
	} = useMovieUserData(id);

	const { visibleStyle } = setUiVisibilityContext();
	const { registrar: registerScroll } = setScrollContext();

	let trailerId: string | undefined;
	let titleProperties: TitleInfoProperty[] = [];

	$: recommendations = tmdbApi.getMovieRecommendations(tmdbId);

	$tmdbMovie.then(async (movie) => {
		const backgrounds =
			movie?.images?.backdrops
				?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
				?.map((bd, i) => ({
					backdropUri: `${bd.file_path}`,
					mediaId: id
				}))
				.filter(bd => bd.backdropUri)
				.slice(0, 5) || [];

		background.setBackgrounds(backgrounds);

		trailerId = movie?.videos?.results?.find(
			(video) => video.type === 'Trailer' && video.site === 'YouTube'
		)?.key;

		if (movie?.runtime) {
			titleProperties.push({
				label: formatMinutesToTime(movie.runtime)
			});
		}

		if (movie?.vote_average) {
			titleProperties.push({
				label: `${movie.vote_average.toFixed(1)} TMDB (${formatThousands(movie.vote_count ?? 0)})`,
				href: `https://www.themoviedb.org/movie/${movie.id}`
			});
		}

		if (movie?.genres) {
			titleProperties.push({
				label: movie.genres.map((g) => g.name).join(', ')
			});
		}

		if ($localSettings.enableTrailers && trailerId) {
			titleProperties.push({
				icon: Video,
				href: `https://www.youtube.com/watch?v=${trailerId}`
			});
		}

		titleProperties = titleProperties;
	});
	$: if ($localSettings.autoplayTrailers && trailerId) {
		background.playYoutubeVideo({ tmdbId: id, videoId: trailerId, onBackground: true });
	}

	onDestroy(() => {
		unsubscribe();
	});
</script>

<div class="relative" use:registerScroll>
	<Container
		class="h-[calc(100vh-4rem)] flex flex-col py-16 px-32"
		on:enter={scrollIntoView({ top: 999 })}
	>
		<HeroCarousel>
			{#await $tmdbMovie then movie}
				{#if movie}
					<HeroTitleInfo
						title={`${movie.title} (${new Date(movie.release_date ?? 0).getFullYear()})`}
						properties={titleProperties}
						overview={movie.overview ?? ''}
					/>
				{/if}
			{/await}
			<Container
				direction="horizontal"
				class="flex mt-8 space-x-4"
				focusOnMount
				on:mount={registrar}
			>
				<Button
					action={handleAutoplay}
					secondaryAction={handleOpenStreamSelector}
					disabled={!$canStream}
				>
					Play
					<Play size={19} slot="icon" />
				</Button>

				{#if trailerId}
					<Button
						on:clickOrSelect={() =>
							trailerId && background.playYoutubeVideo({ tmdbId: id, videoId: trailerId })}
					>
						<Video slot="icon" size={19} />
						Play Trailer
					</Button>
				{/if}

				{#if !$inLibrary}
					<Button action={handleAddToLibrary} icon={Bookmark}>Add to Library</Button>
				{:else}
					<Button action={handleRemoveFromLibrary} icon={Minus}>Remove from Library</Button>
				{/if}

				<Button action={toggleIsWatched}>
					{#if $isWatched}
						Mark as Unwatched
					{:else}
						Mark as Watched
					{/if}
					<Check slot="icon" size={19} />
				</Button>

				{#if PLATFORM_WEB}
					<Button
						on:clickOrSelect={() =>
							window.open('https://www.themoviedb.org/movie/' + tmdbId, '_blank')}
					>
						Open In TMDB
						<ExternalLink size={19} slot="icon-after" />
					</Button>
				{/if}
			</Container>
		</HeroCarousel>
	</Container>
	<div class="relative z-10" style={$visibleStyle}>
		<Container on:enter={scrollIntoView({ top: 0 })} class="">
			{#await $tmdbMovie then movie}
				<Carousel scrollClass="px-32" class="mb-16">
					<div slot="header">Show Cast</div>
					{#each movie?.credits?.cast?.slice(0, 15) || [] as credit}
						<TmdbPersonCard on:enter={scrollIntoView({ left: 128 })} tmdbCredit={credit} />
					{/each}
				</Carousel>
			{/await}
			{#await recommendations then recommendations}
				<Carousel scrollClass="px-32" class="mb-16">
					<div slot="header">Recommendations</div>
					{#each recommendations || [] as recommendation}
						<TmdbCard item={recommendation} on:enter={scrollIntoView({ left: 128 })} />
					{/each}
				</Carousel>
			{/await}
		</Container>
		{#await $tmdbMovie then movie}
			<Container class="flex-1 bg-secondary-950 pt-8 px-32" on:enter={scrollIntoView({ top: 0 })}>
				<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">More Information</h1>
				<div class="text-zinc-300 font-medium text-lg flex flex-wrap">
					<div class="flex-1">
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Directed By</h2>
							<div>
								{movie?.credits.crew
									?.filter((c) => c.job === 'Director')
									?.map((c) => c.name)
									.join(', ')}
							</div>
						</div>
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Written By</h2>
							<div>
								{movie?.credits.crew
									?.filter((c) => c.job === 'Writer')
									?.map((c) => c.name)
									.join(', ')}
							</div>
						</div>
					</div>
					<div class="flex-1">
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Languages</h2>
							<div>
								{movie?.spoken_languages?.map((language) => language.name).join(', ')}
							</div>
						</div>
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Release Date</h2>
							<div>
								{new Date(movie?.release_date || 0).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'short',
									day: 'numeric'
								})}
							</div>
						</div>
					</div>
				</div>
			</Container>
		{/await}
	</div>
</div>
