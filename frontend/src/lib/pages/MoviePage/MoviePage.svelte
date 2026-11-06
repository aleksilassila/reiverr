<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { TmdbMovieFull } from '$lib/apis/reiverr/reiverr.openapi';
	import Button from '$lib/components/Button/Button.svelte';
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import HeroCarousel from '$lib/components/HeroShowcase/HeroCarousel.svelte';
	import type { TitleInfoProperty } from '$lib/components/HeroShowcase/HeroTitleInfo';
	import HeroTitleInfo from '$lib/components/HeroShowcase/HeroTitleInfo.svelte';
	import { createErrorNotification } from '$lib/components/Notifications/notification.store';
	import TmdbPersonCard from '$lib/components/PersonCard/TmdbPersonCard.svelte';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { PLATFORM_WEB } from '$lib/constants';
	import { playMovie } from '$lib/play-media';
	import { downloadsQueries } from '$lib/queries/downloads.queries';
	import { libraryQueries } from '$lib/queries/library.queries';
	import { metadataQueries } from '$lib/queries/metadata.queries';
	import { usePageQuery } from '$lib/queries/page-query';
	import { requestsQueries } from '$lib/queries/requests.queries';
	import { tmdbQueries } from '$lib/queries/tmdb.queries';
	import {
		setMovieInMyList,
		setMovieWatched,
		userDataQueries
	} from '$lib/queries/user-data.queries';
	import { scrollIntoView } from '$lib/selectable';
	import { localSettings } from '$lib/stores/localstorage.store';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import { setUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import { formatMinutesToTime, formatThousands } from '$lib/utils';
	import { Bookmark, Check, ExternalLink, Minus, Play, Plus, Video } from 'radix-icons-svelte';
	import { getMovieRequestStatus } from './movie-status';
	import RequestsView from './RequestsView.svelte';

	export let id: string;

	const componentStack = useComponentStack();
	const background = backgroundContext.createContext({ backgroundMediaId: id, videoMediaId: id });

	const tmdbMovie = usePageQuery(metadataQueries.movie(id));
	const userData = usePageQuery(userDataQueries.movie(id));
	const requests = usePageQuery(requestsQueries.movie(id));
	const statusQuery = usePageQuery(libraryQueries.movieStatus(id));
	const torrents = usePageQuery(downloadsQueries.movieTorrents(id));
	$: movie = $tmdbMovie.data;
	$: status = $statusQuery.data;
	$: requestStatus = getMovieRequestStatus({
		requests: $requests.data,
		status,
		torrents: $torrents.data
	});
	$: inMyList = $userData.data?.inMyList ?? false;
	$: watched = $userData.data?.playState?.watched ?? false;

	// A failure is reported once per failure streak
	let statusFailed = false;
	$: reportStatusFailure($statusQuery.isError, $statusQuery.error);
	function reportStatusFailure(isError: boolean, error: any) {
		if (isError && !statusFailed) {
			createErrorNotification(
				'Could not load the request',
				error?.response?.data?.message ?? error?.message ?? String(error)
			);
		}
		statusFailed = isError;
	}

	$: if (movie) setBackgrounds(movie);
	function setBackgrounds(movie: TmdbMovieFull) {
		const backgrounds =
			movie.images?.backdrops
				?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
				?.map((bd) => ({
					backdropUri: `${bd.file_path}`,
					mediaId: id
				}))
				.filter((bd) => bd.backdropUri && bd.backdropUri !== movie.backdrop_path)
				.slice(0, 4) || [];

		background.setBackgrounds([
			{
				backdropUri: `${movie.backdrop_path}`,
				mediaId: id
			},
			...backgrounds
		]);
	}

	const { visibleStyle } = setUiVisibilityContext();
	const { registrar: registerScroll } = setScrollContext();

	const recommendations = usePageQuery(tmdbQueries.movieRecommendations(Number(id)));

	$: trailerId = movie?.videos?.results?.find(
		(video) => video.type === 'Trailer' && video.site === 'YouTube'
	)?.key;
	$: titleProperties = movie ? getTitleProperties(movie, trailerId) : [];

	function getTitleProperties(movie: TmdbMovieFull, trailerId?: string) {
		const properties: TitleInfoProperty[] = [];

		if (movie.runtime) {
			properties.push({
				label: formatMinutesToTime(movie.runtime)
			});
		}

		if (movie.vote_average) {
			properties.push({
				label: `${movie.vote_average.toFixed(1)} TMDB (${formatThousands(movie.vote_count ?? 0)})`,
				href: `https://www.themoviedb.org/movie/${id}`
			});
		}

		if (movie.genres) {
			properties.push({
				label: movie.genres.map((g) => g.name).join(', ')
			});
		}

		if ($localSettings.enableTrailers && trailerId) {
			properties.push({
				icon: Video,
				href: `https://www.youtube.com/watch?v=${trailerId}`
			});
		}

		return properties;
	}
	$: if ($localSettings.autoplayTrailers && trailerId) {
		background.playYoutubeVideo({ tmdbId: id, videoId: trailerId, onBackground: true });
	}

	// The status of the request of the user and what is on disk, first among the properties
	$: heroProperties = [
		...[requestStatus.tags.primary, requestStatus.tags.secondary].flatMap((tag) =>
			tag ? [{ label: tag.label }] : []
		),
		...titleProperties
	];

	async function play() {
		if (!movie) return;

		await playMovie({
			tmdbId: id,
			title: movie.title ?? '',
			subtitle: movie.release_date ? String(new Date(movie.release_date).getFullYear()) : '',
			progress: $userData.data?.playState?.progress ?? 0,
			playMedia: background.playMedia
		});
	}
</script>

<div class="relative" use:registerScroll>
	<Container
		class="h-[calc(100vh-4rem)] flex flex-col py-16 px-32"
		on:enter={scrollIntoView({ top: 999 })}
	>
		<HeroCarousel>
			{#if movie}
				<HeroTitleInfo
					title={`${movie.title} (${new Date(movie.release_date ?? 0).getFullYear()})`}
					properties={heroProperties}
					overview={movie.overview ?? ''}
				/>
			{/if}
			<Container direction="horizontal" class="flex mt-8 space-x-4" focusOnMount>
				{#if requestStatus.onDisk}
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

				{#if !inMyList}
					<Button action={() => setMovieInMyList(id, true)} icon={Bookmark}>Add to My List</Button>
				{:else}
					<Button action={() => setMovieInMyList(id, false)} icon={Minus}>
						Remove from My List
					</Button>
				{/if}

				{#if watched}
					<Button action={() => setMovieWatched(id, false)} icon={Check}>Mark as Unwatched</Button>
				{:else}
					<Button action={() => setMovieWatched(id, true)} icon={Check}>Mark as Watched</Button>
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
		{#if movie}
			<Carousel scrollClass="px-32" class="mb-8" on:enter={scrollIntoView({ top: 64 + 32 })}>
				<div slot="header">Show Cast</div>
				{#each movie.credits?.cast?.slice(0, 15) || [] as credit}
					<TmdbPersonCard on:enter={scrollIntoView({ left: 128 })} tmdbCredit={credit} />
				{/each}
			</Carousel>
		{/if}
		{#if $recommendations.data?.length}
			<Carousel scrollClass="px-32" class="mb-8" on:enter={scrollIntoView({ top: 64 + 32 })}>
				<div slot="header">Recommendations</div>
				{#each $recommendations.data as recommendation}
					<TmdbCard item={recommendation} on:enter={scrollIntoView({ left: 128 })} />
				{/each}
			</Carousel>
		{/if}
		{#if movie}
			<Container class="flex-1 bg-secondary-950 pt-16 px-32" on:enter={scrollIntoView({ top: 0 })}>
				<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">More Information</h1>
				<div class="text-zinc-300 font-medium text-lg flex flex-wrap">
					<div class="flex-1">
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Directed By</h2>
							<div>
								{movie.credits?.crew
									?.filter((c) => c.job === 'Director')
									?.map((c) => c.name)
									.join(', ')}
							</div>
						</div>
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Written By</h2>
							<div>
								{movie.credits?.crew
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
								{movie.spoken_languages?.map((language) => language.name).join(', ')}
							</div>
						</div>
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Release Date</h2>
							<div>
								{new Date(movie.release_date || 0).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'short',
									day: 'numeric'
								})}
							</div>
						</div>
					</div>
				</div>
			</Container>
		{/if}
	</div>
</div>
