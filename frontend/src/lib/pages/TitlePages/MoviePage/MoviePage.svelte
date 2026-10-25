<script lang="ts">
	import Container from '$components/Container.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import HeroCarousel from '$lib/components/HeroShowcase/HeroCarousel.svelte';
	import TmdbPersonCard from '$lib/components/PersonCard/TmdbPersonCard.svelte';
	import { PLATFORM_WEB } from '$lib/constants';
	import { scrollIntoView } from '$lib/selectable';
	import { localSettings } from '$lib/stores/localstorage.store';
	import { useMovieContext } from '$lib/stores/data/movie-data.store';
	import { getStatusLabel } from '$lib/stores/data/request-status';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import { setUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import { tmdbApi } from '$lib/stores/user.store';
	import { formatMinutesToTime, formatThousands } from '$lib/utils';
	import { Bookmark, Check, ExternalLink, Minus, Play, Plus, Video } from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
	import type { TitleInfoProperty } from '../HeroTitleInfo';
	import HeroTitleInfo from '../HeroTitleInfo.svelte';
	import { playMovie } from '../play-media';
	import RequestsView from './RequestsView.svelte';

	export let id: string;

	const background = backgroundContext.createContext({ backgroundMediaId: id, videoMediaId: id });
	const {
		componentStack,
		movieData,
		statusData,
		inLibrary,
		isWatched,
		progress,
		setInLibrary,
		setWatched,
		setStale,
		unsubscribe
	} = useMovieContext(id).createContext();
	const { promise: tmdbMovie } = movieData;
	const { data: status } = statusData;

	$tmdbMovie.then(async (movie) => {
		const backgrounds =
			movie?.images?.backdrops
				?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
				?.map((bd, i) => ({
					backdropUri: `${bd.file_path}`,
					mediaId: id
				}))
				.filter((bd) => bd.backdropUri && bd.backdropUri !== movie?.backdrop_path)
				.slice(0, 4) || [];

		background.setBackgrounds([
			{
				backdropUri: `${movie?.backdrop_path}`,
				mediaId: id
			},
			...backgrounds
		]);
	});

	const { visibleStyle } = setUiVisibilityContext();
	const { registrar: registerScroll } = setScrollContext();

	let trailerId: string | undefined;
	let titleProperties: TitleInfoProperty[] = [];

	$: recommendations = tmdbApi.v3
		.movieRecommendations(Number(id))
		.then((r) => (r.data as any).results);

	$tmdbMovie.then(async (movie) => {
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
				href: `https://www.themoviedb.org/movie/${id}`
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

	// Where the request of the user stands, or what is on disk, first among the properties
	$: statusLabel = getStatusLabel($status);
	$: heroProperties = statusLabel ? [{ label: statusLabel }, ...titleProperties] : titleProperties;

	async function play() {
		const movie = await $tmdbMovie;
		if (!movie) return;

		await playMovie({
			tmdbId: id,
			title: movie.title ?? '',
			subtitle: movie.release_date ? String(new Date(movie.release_date).getFullYear()) : '',
			progress: $progress,
			playMedia: background.playMedia,
			onProgressSaved: setStale
		});
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
						properties={heroProperties}
						overview={movie.overview ?? ''}
					/>
				{/if}
			{/await}
			<Container direction="horizontal" class="flex mt-8 space-x-4" focusOnMount>
				{#if $status?.onDisk}
					<Button action={play} icon={Play}>Play</Button>
				{/if}

				<Button
					icon={Plus}
					on:clickOrSelect={() =>
						componentStack.push({ component: RequestsView, props: { tmdbId: id } })}
				>
					Request
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
					<Button action={() => setInLibrary(true)} icon={Bookmark}>Add to My List</Button>
				{:else}
					<Button action={() => setInLibrary(false)} icon={Minus}>Remove from My List</Button>
				{/if}

				{#if $isWatched}
					<Button action={() => setWatched(false)} icon={Check}>Mark as Unwatched</Button>
				{:else}
					<Button action={() => setWatched(true)} icon={Check}>Mark as Watched</Button>
				{/if}

				{#if PLATFORM_WEB}
					<Button
						on:clickOrSelect={() => window.open('https://www.themoviedb.org/movie/' + id, '_blank')}
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
				{#if recommendations?.length}
					<Carousel scrollClass="px-32" class="mb-16">
						<div slot="header">Recommendations</div>
						{#each recommendations as recommendation}
							<TmdbCard item={recommendation} on:enter={scrollIntoView({ left: 128 })} />
						{/each}
					</Carousel>
				{/if}
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
								{movie?.credits?.crew
									?.filter((c) => c.job === 'Director')
									?.map((c) => c.name)
									.join(', ')}
							</div>
						</div>
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Written By</h2>
							<div>
								{movie?.credits?.crew
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
