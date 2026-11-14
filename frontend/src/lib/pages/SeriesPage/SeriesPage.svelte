<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { TmdbSeriesFull } from '$lib/apis/reiverr/reiverr.openapi';
	import Button from '$lib/components/Button/Button.svelte';
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import TmdbEpisodeCard from '$lib/components/EpisodeCard/TmdbEpisodeCard.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import HeroCarousel from '$lib/components/HeroShowcase/HeroCarousel.svelte';
	import type { TitleInfoProperty } from '$lib/components/HeroShowcase/HeroTitleInfo';
	import TitleProperties from '$lib/components/HeroShowcase/HeroTitleInfo.svelte';
	import { createErrorNotification } from '$lib/components/Notifications/notification.store';
	import TmdbPersonCard from '$lib/components/PersonCard/TmdbPersonCard.svelte';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { PLATFORM_WEB, TMDB_BACKDROP_SMALLEST } from '$lib/constants';
	import { playEpisode } from '$lib/play-media';
	import { downloadsQueries } from '$lib/queries/downloads.queries';
	import { libraryQueries } from '$lib/queries/library.queries';
	import { metadataQueries } from '$lib/queries/metadata.queries';
	import { usePageQuery } from '$lib/queries/page-query';
	import { requestsQueries } from '$lib/queries/requests.queries';
	import { tmdbQueries } from '$lib/queries/tmdb.queries';
	import { setSeriesInMyList, userDataQueries } from '$lib/queries/user-data.queries';
	import { scrollIntoView } from '$lib/selectable';
	import { localSettings } from '$lib/stores/localstorage.store';
	import { getScrollContext, setScrollContext } from '$lib/stores/scroll.store';
	import { setUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import { formatThousands } from '$lib/utils';
	import classNames from 'classnames';
	import { Bookmark, ExternalLink, Minus, Plus, Video } from 'radix-icons-svelte';
	import { toStore } from 'svelte/store';
	import { useEpisodeCarousel } from './episode-carousel';
	import { getEpisodeData, getEpisodeRequestStatus } from './episode-status';
	import EpisodeActionsSheet from './EpisodeActionsSheet.svelte';
	import RequestsView from './RequestsView.svelte';

	interface Props {
		id: string;
	}

	let { id }: Props = $props();

	const componentStack = useComponentStack();
	const background = backgroundContext.createContext({ backgroundMediaId: id, videoMediaId: id });

	const tmdbSeries = usePageQuery(() => metadataQueries.series(id));
	const userData = usePageQuery(() => userDataQueries.series(id));
	const requests = usePageQuery(() => requestsQueries.series(id));
	const status = usePageQuery(() => libraryQueries.seriesStatus(id));
	const torrents = usePageQuery(() => downloadsQueries.seriesTorrents(id));
	let series = $derived(tmdbSeries.data);
	let episodesData = $derived(getEpisodeData(tmdbSeries.data, userData.data));

	// The labels of the episodes go missing while the status cannot be loaded; said once per failure
	let statusFailed = false;
	function reportStatusFailure(isError: boolean, error: any) {
		if (isError && !statusFailed) {
			createErrorNotification(
				'Could not load requests',
				error?.response?.data?.message ?? error?.message ?? String(error)
			);
		}
		statusFailed = isError;
	}

	function setBackgrounds(series: TmdbSeriesFull) {
		const backgrounds =
			series.images?.backdrops
				?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
				?.map((bd) => ({
					backdropUri: `${bd.file_path}`,
					mediaId: id
				}))
				.filter((bd) => bd.backdropUri && bd.backdropUri !== series.backdrop_path)
				.slice(0, 4) || [];
		background.setBackgrounds([
			{
				backdropUri: `${series.backdrop_path}`,
				mediaId: id
			},
			...backgrounds
		]);
	}

	const {
		selectedEpisode,
		selectedTmdbEpisode,
		onEpisodeMount,
		onEpisodeCardMouseEnter,
		onEpisodeCardMouseLeave
	} = useEpisodeCarousel(
		id,
		toStore(() => series),
		toStore(() => episodesData)
	);

	const { visibleStyle } = setUiVisibilityContext();
	const { registrar: scrollRegistrar } = setScrollContext();

	const { topVisible } = getScrollContext();

	const recommendations = usePageQuery(() => tmdbQueries.seriesRecommendations(Number(id)));

	function getTitleProperties(series: TmdbSeriesFull, trailerId?: string) {
		const properties: TitleInfoProperty[] = [];

		if (series.status !== 'Ended') {
			properties.push({
				label: `Since ${new Date(series.first_air_date || Date.now())?.getFullYear()}`
			});
		} else {
			properties.push({
				label: `Ended ${new Date(series.last_air_date || Date.now())?.getFullYear()}`
			});
		}

		if (series.vote_average) {
			properties.push({
				label: `${series.vote_average.toFixed(1)} TMDB (${formatThousands(
					series.vote_count ?? 0
				)})`,
				href: `https://www.themoviedb.org/tv/${id}`
			});
		}

		if (series.genres) {
			properties.push({
				label: series.genres.map((g) => g.name).join(', ')
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
	let requestsData = $derived({
		requests: requests.data,
		status: status.data,
		torrents: torrents.data
	});
	let inMyList = $derived(userData.data?.inMyList ?? false);
	$effect(() => {
		reportStatusFailure(status.isError, status.error);
	});
	$effect(() => {
		if (series) setBackgrounds(series);
	});
	let trailerId = $derived(
		series?.videos?.results?.find((video) => video.type === 'Trailer' && video.site === 'YouTube')
			?.key
	);
	let titleProperties = $derived(series ? getTitleProperties(series, trailerId) : []);
	$effect(() => {
		if ($localSettings.autoplayTrailers && trailerId) {
			background.playYoutubeVideo({
				tmdbId: id,
				videoId: trailerId,
				onBackground: true
			});
		}
	});
</script>

<!-- Prefetching blurred background -->
{#if $background?.backdropUri}
	<!-- <link
		rel="prefetch"
		as="image"
		href={`${TMDB_BACKDROP_SMALLEST}${$background.backdropUri}`}
		type="image/jpeg"
	/> -->
	<img
		src={`${TMDB_BACKDROP_SMALLEST}${$background.backdropUri}`}
		alt="Background"
		loading="lazy"
		class="absolute opacity-0"
	/>
{/if}

<div class="relative" use:scrollRegistrar>
	<HeroCarousel class="h-[calc(100vh-7.5rem)] relative" onEnter={scrollIntoView({ top: 0 })}>
		{#if $selectedTmdbEpisode}
			<div
				class={classNames(
					'flex flex-col pt-16 pb-8 px-32 transition-opacity inset-x-0 bottom-0 absolute delay-150',
					{
						'opacity-0': $topVisible
					}
				)}
				style="transform: translateZ(0);"
			>
				<TitleProperties
					title={$selectedTmdbEpisode.name ?? ''}
					properties={$selectedTmdbEpisode.properties}
					overview={$selectedTmdbEpisode.overview ?? ''}
				/>

				<!-- {#if !PLATFORM_TV}
						<div class="flex mt-8 space-x-4">
							<AnimateScale hasFocus={false}>
								<button
									class="h-12 flex-1 flex items-center group font-medium tracking-wide bg-secondary-800 selectable rounded-xl px-6 cursor-pointer"
								 onclick={() =>
										openEpisodeMenu(
											$selectedTmdbEpisode?.season_number ?? 1,
											$selectedTmdbEpisode?.episode_number ?? 1
										)}
								>
									<InfoCircled size={19} class="mr-2" />
									Details
								</button>
							</AnimateScale>
						</div>
					{/if} -->
			</div>
		{/if}

		<div
			class={classNames(
				'flex flex-col pt-16 pb-8 px-32 transition-opacity inset-x-0 bottom-0 absolute delay-150',
				{
					'opacity-0 pointer-events-none': !$topVisible && $selectedTmdbEpisode
				}
			)}
			style="transform: translateZ(0);"
		>
			{#if series}
				<TitleProperties
					title={series.name ?? ''}
					properties={titleProperties}
					overview={series.overview ?? ''}
				/>
			{/if}
			<Container direction="horizontal" class="flex mt-8 space-x-4" focusOnMount>
				<!-- <Button
					action={autoplayStream}
					secondaryAction={() => {
						// openEpisodeMenu(tmdbId, $nextEpisode?.season, $nextEpisode?.episode)
					}}
					disabled={!$autoplayCandidate.candidate}
				>
					{#if $nextEpisode?.episode && $nextEpisode?.season}
						Play S{$nextEpisode?.season}E{$nextEpisode?.episode}
					{:else}
						Play
					{/if}
					<Play size={19} slot="icon" />
				</Button> -->

				<Button
					icon={Plus}
					onClickOrSelect={() =>
						componentStack.push({ component: RequestsView, props: { tmdbId: id } })}
				>
					Requests
				</Button>

				{#if !inMyList}
					<Button action={() => setSeriesInMyList(id, true)} icon={Bookmark}>Add to My List</Button>
				{:else}
					<Button action={() => setSeriesInMyList(id, false)} icon={Minus}>
						Remove from My List
					</Button>
				{/if}

				{#if trailerId}
					<Button
						icon={Video}
						onClickOrSelect={() =>
							trailerId && background.playYoutubeVideo({ tmdbId: id, videoId: trailerId })}
					>
						Play Trailer
					</Button>
				{/if}

				<!-- <Button action={toggleIsWatched}>
						{#if $isWatched}
							Mark as Unwatched
						{:else}
							Mark as Watched
						{/if}
						<Check slot="icon" size={19} />
					</Button> -->
				<!-- <Button
				 onClickOrSelect={() => {
						// openManageSeries(tmdbId)
					}}
				>
					Manage
					<Gear slot="icon" size={19} />
				</Button> -->

				{#if PLATFORM_WEB}
					<Button
						icon={ExternalLink}
						iconPosition="after"
						onClickOrSelect={() => window.open(`https://www.themoviedb.org/tv/${id}`, '_blank')}
					>
						Open in TMDB
					</Button>
				{/if}
			</Container>
		</div>
	</HeroCarousel>
	<div class="relative z-10" style={$visibleStyle}>
		{#if series}
			{@const tmdbSeries = series}
			{@const episodes = tmdbSeries.seasons?.map((s) => s?.episodes ?? [])?.flat() ?? []}
			{#if episodes.length}
				<Carousel
					scrollClass="px-32"
					onEnter={scrollIntoView({ bottom: 64 })}
					class="mb-8"
					hideControls={$topVisible}
					scrollIndexes
					focusFirstOnBack={false}
					onScrollIndex={(i) => {
						const episode = episodes[i];

						selectedEpisode.set({
							season: episode?.season_number ?? 1,
							episode: episode?.episode_number ?? 1
						});
					}}
				>
					{#snippet header()}
						<span
							class={classNames('transition-opacity', {
								// 'opacity-0': $topVisible
							})}
						>
							{#if $selectedTmdbEpisode}
								Season {$selectedTmdbEpisode.season_number}
								<!-- <div class="text-secondary-400 text-sm">
										{$selectedTmdbEpisode.season.episodes?.length} Episodes
									</div> -->
							{:else}
								Episodes
							{/if}
						</span>
					{/snippet}

					{#snippet children({ scrollToIndex })}
						{#each episodes as episode, i (episode.id)}
							{@const userData = episodesData.episodes.find(
								(e) => e.season === episode.season_number && e.episode === episode.episode_number
							)}
							{@const requestStatus = getEpisodeRequestStatus(
								requestsData,
								episode.season_number ?? 0,
								episode.episode_number ?? 0
							)}

							{#key episode.id}
								<TmdbEpisodeCard
									{episode}
									statusTags={requestStatus.tags}
									series={tmdbSeries}
									onMounted={(e) =>
										onEpisodeMount(e, episode.season_number ?? 1, episode.episode_number ?? 1)}
									onEnter={(e) => {
										// if (PLATFORM_TV) {
										// 	scrollIntoView({
										// 		left: 128
										// 	})(e);
										// } else {
										scrollToIndex(i);
										// }

										// selectedEpisode.set({
										// 	season: episode.season_number ?? 1,
										// 	episode: episode.episode_number ?? 1
										// });
									}}
									onmouseenter={() =>
										onEpisodeCardMouseEnter({
											episode: episode.episode_number ?? 1,
											season: episode.season_number ?? 1
										})}
									onmouseleave={() => onEpisodeCardMouseLeave()}
									isWatched={userData?.watched || false}
									progress={userData?.progress}
									onLongPress={() =>
										componentStack.push({
											component: EpisodeActionsSheet,
											props: {
												tmdbId: id,
												season: episode.season_number ?? 0,
												episode: episode.episode_number ?? 0,
												name: episode.name ?? '',
												seriesName: tmdbSeries.name ?? ''
											}
										})}
									onClickOrSelect={() =>
										playEpisode({
											tmdbId: id,
											season: episode.season_number ?? 0,
											episode: episode.episode_number ?? 0,
											title: episode.name ?? '',
											subtitle: `${tmdbSeries.name ?? ''} · Season ${episode.season_number} Episode ${episode.episode_number}`,
											progress: userData?.progress,
											playMedia: background.playMedia
										})}
								/>
							{/key}
						{/each}
						<!-- <div use:episodeCardsObserver /> -->
					{/snippet}
				</Carousel>
			{/if}
		{/if}

		{#if series}
			{@const seasonCredits = series.seasons?.find(
				(s) => s.season_number === ($selectedTmdbEpisode?.season_number ?? 1)
			)?.aggregate_credits}
			<Carousel scrollClass="px-32" class="mb-8" onEnter={scrollIntoView({ top: 64 + 32 })}>
				{#snippet header()}
					<div>
						{#if seasonCredits}
							Season {$selectedTmdbEpisode?.season_number ?? 1} Cast
						{:else}
							Show Cast
						{/if}
					</div>
				{/snippet}
				{#each (seasonCredits ?? series.aggregate_credits)?.cast?.slice(0, 15) || [] as credit, i (credit.id)}
					<TmdbPersonCard onEnter={scrollIntoView({ left: 128 })} tmdbCredit={credit} index={i} />
				{/each}
			</Carousel>
		{/if}
		{#if recommendations.data?.length}
			<Carousel scrollClass="px-32" class="mb-8" onEnter={scrollIntoView({ top: 64 + 32 })}>
				{#snippet header()}
					<div>Recommendations</div>
				{/snippet}
				{#each recommendations.data as recommendation (recommendation.id)}
					<TmdbCard item={recommendation} onEnter={scrollIntoView({ left: 128 })} />
				{/each}
			</Carousel>
		{/if}
		{#if series}
			<Container
				class="flex-1 bg-secondary-950 pt-16 pb-8 px-32"
				onEnter={scrollIntoView({ bottom: 0 })}
			>
				<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">More Information</h1>
				<div class="text-zinc-300 font-medium text-lg flex flex-wrap">
					<div class="flex-1">
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Created By</h2>
							{#each series.created_by || [] as creator}
								<div>{creator.name}</div>
							{/each}
						</div>
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Network</h2>
							<div>{series.networks?.[0]?.name}</div>
						</div>
						{#if series.number_of_seasons}
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Seasons</h2>
								<div>{series.number_of_seasons}</div>
							</div>
						{/if}
					</div>
					<div class="flex-1">
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Language</h2>
							<div>{series.spoken_languages?.[0]?.name}</div>
						</div>
						<div class="mb-8">
							<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Last Air Date</h2>
							<div>{series.last_air_date}</div>
						</div>
						{#if series.number_of_episodes}
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Episodes</h2>
								<div>{series.number_of_episodes}</div>
							</div>
						{/if}
					</div>
				</div>
			</Container>
		{/if}
	</div>
</div>
