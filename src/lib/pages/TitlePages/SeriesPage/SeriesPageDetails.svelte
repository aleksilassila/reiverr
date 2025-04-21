<script lang="ts">
	import Container from '$components/Container.svelte';
	import Button from '$lib/components/Button.svelte';
	import TmdbCard from '$lib/components/Card/TmdbCard.svelte';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import ComponentStackContainer from '$lib/components/ComponentStack/ComponentStackContainer.svelte';
	import TmdbEpisodeCard from '$lib/components/EpisodeCard/TmdbEpisodeCard.svelte';
	import { getBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import HeroCarousel from '$lib/components/HeroShowcase/HeroCarousel.svelte';
	import TmdbPersonCard from '$lib/components/PersonCard/TmdbPersonCard.svelte';
	import { getStackRouterPage } from '$lib/components/StackRouter/StackRouter';
	import { PLATFORM_TV, PLATFORM_WEB } from '$lib/constants';
	import { scrollIntoView, useRegistrar } from '$lib/selectable';
	import { localSettings } from '$lib/stores/localstorage.store';
	import { getScrollContext, setScrollContext } from '$lib/stores/scroll.store';
	import { setUiVisibilityContext } from '$lib/stores/ui-visibility.store';
	import { seriesUserDataContext } from '$lib/stores/user-data/title-user-data.store';
	import { tmdbApi } from '$lib/stores/user.store';
	import { formatThousands } from '$lib/utils';
	import classNames from 'classnames';
	import {
		Bookmark,
		Check,
		ExternalLink,
		InfoCircled,
		Minus,
		Play,
		Video
	} from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
	import { titlePageContext } from '../ActionsPage/actions-page';
	import ActionsMenu from '../ActionsPage/ActionsMenu.svelte';
	import type { TitleInfoProperty } from '../HeroTitleInfo';
	import TitleProperties from '../HeroTitleInfo.svelte';
	import { useEpisodeCarousel } from './episode-carousel';
	import AnimateScale from '$lib/components/AnimateScale.svelte';

	const { registrar } = getStackRouterPage();

	const {
		tmdbId,
		tmdbSeries,
		inLibrary,
		handleAddToLibrary,
		handleRemoveFromLibrary,
		nextEpisode,
		episodesUserData,
		isWatched,
		toggleIsWatched,
		autoplayCandidate,
		autoplayStream,
		unsubscribe
	} = seriesUserDataContext.getContext();
	const { componentStack } = titlePageContext.getContext();
	const background = getBackgroundPage();
	const {
		data: episodes,
		selectedEpisode,
		selectedTmdbEpisode,
		interactionObserver: episodeCardsObserver,
		...episodeCarousel
	} = useEpisodeCarousel();

	const { visibleStyle } = setUiVisibilityContext();
	const { registrar: scrollRegistrar } = setScrollContext();

	// const episodeCards = useRegistrar();
	let trailerId: string | undefined;
	let titleProperties: TitleInfoProperty[] = [];
	const { topVisible } = getScrollContext();

	$: recommendations = tmdbApi.v3
		.tvSeriesRecommendations(Number(tmdbId))
		.then((r) => r.data.results);

	$tmdbSeries.then((series) => {
		trailerId = series?.videos?.results?.find(
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
				href: `https://www.themoviedb.org/tv/${tmdbId}`
			});
		}

		if (series?.genres) {
			titleProperties.push({
				label: series.genres.map((g) => g.name).join(', ')
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
		background?.playYoutubeVideo({ tmdbId, videoId: trailerId, onBackground: true });
	}

	function openEpisodeMenu(season: number, episode: number) {
		componentStack.create(ActionsMenu, {
			tmdbId,
			season,
			episode
		});
	}

	onDestroy(() => {
		unsubscribe();
	});
</script>

<ComponentStackContainer>
	<div class="relative" use:scrollRegistrar>
		<HeroCarousel class="h-[calc(100vh-7.5rem)] relative" on:enter={scrollIntoView({ top: 0 })}>
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

					{#if !PLATFORM_TV}
						<div class="flex mt-8 space-x-4">
							<AnimateScale hasFocus={false}>
								<button
									class="h-12 flex-1 flex items-center group font-medium tracking-wide bg-secondary-800 selectable rounded-xl px-6 cursor-pointer"
									on:click={() =>
										openEpisodeMenu(
											$selectedTmdbEpisode?.season_number ?? 1,
											$selectedTmdbEpisode?.episode_number ?? 1
										)}
								>
									<InfoCircled size={19} slot="icon" class="mr-2" />
									Details
								</button>
							</AnimateScale>
						</div>
					{/if}
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
					class="flex mt-8 space-x-4"
					focusOnMount
					on:mount={registrar}
				>
					<Button
						action={autoplayStream}
						secondaryAction={() => openEpisodeMenu($nextEpisode?.season, $nextEpisode?.episode)}
						disabled={!$autoplayCandidate.candidate}
					>
						{#if $nextEpisode?.episode && $nextEpisode?.season}
							Play S{$nextEpisode?.season}E{$nextEpisode?.episode}
						{:else}
							Play
						{/if}
						<Play size={19} slot="icon" />
					</Button>

					{#if trailerId}
						<Button
							on:clickOrSelect={() =>
								trailerId && background?.playYoutubeVideo({ tmdbId, videoId: trailerId })}
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
								window.open(`https://www.themoviedb.org/tv/${tmdbId}`, '_blank')}
						>
							Open In TMDB
							<ExternalLink size={19} slot="icon-after" />
						</Button>
					{/if}
				</Container>
			</div>
		</HeroCarousel>
		<div class="relative z-10" style={$visibleStyle}>
			{#await $tmdbSeries then tmdbSeries}
				{#if $episodes.length}
					<Carousel
						scrollClass="px-32"
						on:enter={scrollIntoView({ bottom: 128 + 64 })}
						class="mb-8"
						hideControls={$topVisible}
						scrollIndexes
						focusFirstOnBack={false}
						on:scrollIndex={({ detail: i }) => {
							const episode = $episodes[i];

							selectedEpisode.set({
								season: episode?.season_number ?? 1,
								episode: episode?.episode_number ?? 1
							});
						}}
						let:scrollToIndex
					>
						<span
							slot="header"
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

						{#each $episodes as episode, i (episode.id)}
							{@const userData = $episodesUserData.find(
								(e) => e.season === episode.season_number && e.episode === episode.episode_number
							)}
							{#key episode.id}
								<TmdbEpisodeCard
									{episode}
									series={tmdbSeries}
									on:mount={(e) =>
										episodeCarousel.onEpisodeMount(
											e.detail,
											episode.season_number ?? 1,
											episode.episode_number ?? 1
										)}
									on:enter={(e) => {
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
									isWatched={userData?.watched || false}
									progress={userData?.progress}
									on:select={() =>
										openEpisodeMenu(episode?.season_number ?? 1, episode.episode_number ?? 1)}
									on:click={() => scrollToIndex(i)}
								/>
							{/key}
						{/each}
						<div use:episodeCardsObserver />
					</Carousel>
				{/if}
			{/await}

			{#await $tmdbSeries then series}
				<Carousel scrollClass="px-32" class="mb-8" on:enter={scrollIntoView({ top: 64 + 32 })}>
					<div slot="header">
						{#if $selectedTmdbEpisode?.season.aggregate_credits}
							Season {$selectedTmdbEpisode.season_number} Cast
						{:else}
							Show Cast
						{/if}
					</div>
					{#each ($selectedTmdbEpisode?.season.aggregate_credits ?? series?.aggregate_credits)?.cast?.slice(0, 15) || [] as credit (credit.id)}
						<TmdbPersonCard on:enter={scrollIntoView({ left: 128 })} tmdbCredit={credit} />
					{/each}
				</Carousel>
			{/await}
			{#await recommendations then recommendations}
				<Carousel scrollClass="px-32" class="mb-8" on:enter={scrollIntoView({ top: 64 + 32 })}>
					<div slot="header">Recommendations</div>
					{#each recommendations || [] as recommendation (recommendation.id)}
						<TmdbCard item={recommendation} on:enter={scrollIntoView({ left: 128 })} />
					{/each}
				</Carousel>
			{/await}
			{#await $tmdbSeries then series}
				<Container
					class="flex-1 bg-secondary-950 pt-16 pb-8 px-32"
					on:enter={scrollIntoView({ bottom: 0 })}
				>
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
								<div>{series?.spoken_languages?.[0]?.name}</div>
							</div>
							<div class="mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Last Air Date</h2>
								<div>{series?.last_air_date}</div>
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
			{/await}
		</div>
	</div>
</ComponentStackContainer>
