<script lang="ts">
	import Container from '../../../Container.svelte';
	import HeroCarousel from '../HeroCarousel/HeroCarousel.svelte';
	import DetachedPage from '../DetachedPage/DetachedPage.svelte';
	import { useActionRequest, useDependantRequest, useRequest } from '../../stores/data.store';
	import { tmdbApi, type TmdbSeasonEpisode } from '../../apis/tmdb/tmdb-api';
	import { PLATFORM_WEB, TMDB_IMAGES_ORIGINAL } from '../../constants';
	import classNames from 'classnames';
	import { DotFilled, Download, ExternalLink, File, Play, Plus } from 'radix-icons-svelte';
	import { jellyfinApi } from '../../apis/jellyfin/jellyfin-api';
	import { sonarrApi } from '../../apis/sonarr/sonarr-api';
	import Button from '../Button.svelte';
	import { playerState } from '../VideoPlayer/VideoPlayer';
	import { modalStack } from '../Modal/modal.store';
	import { derived } from 'svelte/store';
	import { scrollIntoView, useRegistrar } from '../../selectable';
	import ScrollHelper from '../ScrollHelper.svelte';
	import Carousel from '../Carousel/Carousel.svelte';
	import TmdbPersonCard from '../PersonCard/TmdbPersonCard.svelte';
	import TmdbCard from '../Card/TmdbCard.svelte';
	import EpisodeGrid from './EpisodeGrid.svelte';
	import { Route } from 'svelte-navigator';
	import EpisodePage from '../../pages/EpisodePage.svelte';
	import SeriesMediaManagerModal from '../MediaManagerModal/SeasonMediaManagerModal.svelte';

	export let id: string;

	const { promise: tmdbSeries, data: tmdbSeriesData } = useRequest(
		tmdbApi.getTmdbSeries,
		Number(id)
	);
	const { promise: sonarrItem } = useRequest(sonarrApi.getSeriesByTmdbId, Number(id));
	const jellyfinSeries = getJellyfinSeries(id);

	const { promise: recommendations } = useRequest(tmdbApi.getSeriesRecommendations, Number(id));

	const jellyfinEpisodes = jellyfinSeries.then(
		(s) => (s && jellyfinApi.getJellyfinEpisodes(s.Id)) || []
	);

	const nextJellyfinEpisode = jellyfinEpisodes.then((items) =>
		items.find((i) => i.UserData?.Played === false)
	);

	let hideInterface = false;
	const episodeCards = useRegistrar();
	let scrollTop: number;

	modalStack.top.subscribe((modal) => {
		hideInterface = !!modal;
	});

	function getJellyfinSeries(id: string) {
		return jellyfinApi.getLibraryItemFromTmdbId(id);
	}
</script>

<DetachedPage let:handleGoBack let:registrar>
	<ScrollHelper bind:scrollTop />
	<div class="relative">
		<Container
			class="h-screen flex flex-col py-12 px-20"
			on:enter={scrollIntoView({ top: 0 })}
			on:navigate={({ detail }) => {
				if (detail.direction === 'down' && detail.willLeaveContainer) {
					$episodeCards?.focus();
					detail.preventNavigation();
				}
			}}
		>
			<HeroCarousel
				urls={$tmdbSeries.then(
					(series) =>
						series?.images.backdrops
							?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
							?.map((i) => TMDB_IMAGES_ORIGINAL + i.file_path)
							.slice(0, 5) || []
				)}
				{hideInterface}
			>
				<Container />
				<div class="h-full flex-1 flex flex-col justify-end">
					{#await $tmdbSeries then series}
						{#if series}
							<div
								class={classNames(
									'text-left font-medium tracking-wider text-stone-200 hover:text-amber-200 mt-2',
									{
										'text-4xl sm:text-5xl 2xl:text-6xl': series.name?.length || 0 < 15,
										'text-3xl sm:text-4xl 2xl:text-5xl': series.name?.length || 0 >= 15
									}
								)}
							>
								{series.name}
							</div>
							<div
								class="flex items-center gap-1 uppercase text-zinc-300 font-semibold tracking-wider mt-2 text-lg"
							>
								<p class="flex-shrink-0">
									{#if series.status !== 'Ended'}
										Since {new Date(series.first_air_date || Date.now())?.getFullYear()}
									{:else}
										Ended {new Date(series.last_air_date || Date.now())?.getFullYear()}
									{/if}
								</p>
								<!-- <DotFilled />
								<p class="flex-shrink-0">{movie.runtime}</p> -->
								<DotFilled />
								<p class="flex-shrink-0">
									<a href={'https://www.themoviedb.org/movie/' + series.id}
										>{series.vote_average} TMDB</a
									>
								</p>
							</div>
							<div class="text-stone-300 font-medium line-clamp-3 opacity-75 max-w-4xl mt-4">
								{series.overview}
							</div>
						{/if}
					{/await}
					{#await Promise.all( [$sonarrItem, jellyfinSeries, jellyfinEpisodes, nextJellyfinEpisode] ) then [sonarrItem, jellyfinItem, jellyfinEpisodes, nextJellyfinEpisode]}
						<Container
							direction="horizontal"
							class="flex mt-8"
							focusOnMount
							on:navigate={handleGoBack}
							on:back={handleGoBack}
							on:mount={registrar}
						>
							{#if nextJellyfinEpisode}
								<Button
									class="mr-4"
									on:clickOrSelect={() =>
										nextJellyfinEpisode?.Id && playerState.streamJellyfinId(nextJellyfinEpisode.Id)}
								>
									Play Season {nextJellyfinEpisode?.ParentIndexNumber} Episode
									{nextJellyfinEpisode?.IndexNumber}
									<Play size={19} slot="icon" />
								</Button>
							{/if}
							<Button
								class="mr-4"
								on:clickOrSelect={() =>
									modalStack.create(SeriesMediaManagerModal, { id: Number(id) })}
							>
								{#if jellyfinItem}
									Manage Media
								{:else}
									Request
								{/if}
								<svelte:component this={jellyfinItem ? File : Download} size={19} slot="icon" />
							</Button>
							{#if PLATFORM_WEB}
								<Button class="mr-4">
									Open In TMDB
									<ExternalLink size={19} slot="icon-after" />
								</Button>
								<Button class="mr-4">
									Open In Jellyfin
									<ExternalLink size={19} slot="icon-after" />
								</Button>
							{/if}
						</Container>
					{/await}
				</div>
			</HeroCarousel>
		</Container>
		<div
			class={classNames('transition-opacity', {
				'opacity-0': hideInterface
			})}
		>
			<EpisodeGrid
				on:enter={scrollIntoView({ top: 32 })}
				id={Number(id)}
				tmdbSeries={tmdbSeriesData}
				{jellyfinEpisodes}
				currentJellyfinEpisode={nextJellyfinEpisode}
				on:mount={episodeCards.registrar}
			/>
			<Container on:enter={scrollIntoView({ top: 0 })} class="pt-8">
				{#await $tmdbSeries then series}
					<Carousel scrollClass="px-20" class="mb-8">
						<div slot="header">Show Cast</div>
						{#each series?.aggregate_credits?.cast?.slice(0, 15) || [] as credit}
							<TmdbPersonCard
								on:enter={scrollIntoView({ horizontal: 64 + 30 })}
								tmdbCredit={credit}
							/>
						{/each}
					</Carousel>
				{/await}
				{#await $recommendations then recommendations}
					<Carousel scrollClass="px-20" class="mb-8">
						<div slot="header">Recommendations</div>
						{#each recommendations || [] as recommendation}
							<TmdbCard item={recommendation} on:enter={scrollIntoView({ horizontal: 64 + 30 })} />
						{/each}
					</Carousel>
				{/await}
			</Container>
			{#await $tmdbSeries then series}
				<Container class="flex-1 bg-secondary-950 pt-8 px-20" on:enter={scrollIntoView({ top: 0 })}>
					<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">More Information</h1>
					<div class="text-zinc-300 font-medium text-lg flex flex-wrap">
						<div class="flex-1">
							<div class="border-l-2 border-zinc-300 pl-4 mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Created By</h2>
								{#each series?.created_by || [] as creator}
									<div>{creator.name}</div>
								{/each}
							</div>
							<div class="border-l-2 border-zinc-300 pl-4 mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Network</h2>
								<div>{series?.networks?.[0]?.name}</div>
							</div>
						</div>
						<div class="flex-1">
							<div class="border-l-2 border-zinc-300 pl-4 mb-8">
								<h2 class="uppercase text-sm font-semibold text-zinc-500 mb-0.5">Language</h2>
								<div>{series?.spoken_languages?.[0]?.name}</div>
							</div>
							<div class="border-l-2 border-zinc-300 pl-4 mb-8">
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

<Route path="/season/:season/episode/:episode/*" component={EpisodePage} {id} />
