<script lang="ts">
	import type { JellyfinItem } from '$lib/apis/jellyfin/jellyfinApi';
	import { addSeriesToSonarr } from '$lib/apis/sonarr/sonarrApi';
	import {
		getTmdbSeries,
		getTmdbSeriesRecommendations,
		getTmdbSeriesSeasons,
		getTmdbSeriesSimilar
	} from '$lib/apis/tmdb/tmdbApi';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card/Card.svelte';
	import { fetchCardTmdbProps } from '$lib/components/Card/card';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import UiCarousel from '$lib/components/Carousel/UICarousel.svelte';
	import EpisodeCard from '$lib/components/EpisodeCard/EpisodeCard.svelte';
	import { createModalProps } from '$lib/components/Modal/Modal';
	import PeopleCard from '$lib/components/PeopleCard/PeopleCard.svelte';
	import SeriesRequestModal from '$lib/components/RequestModal/SeriesRequestModal.svelte';
	import { playerState } from '$lib/components/VideoPlayer/VideoPlayer';
	import { TMDB_IMAGES_ORIGINAL, TMDB_POSTER_SMALL } from '$lib/constants';
	import { createLibraryItemStore, library } from '$lib/stores/library.store';
	import { capitalize, formatMinutesToTime, formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { Archive, ChevronLeft, ChevronRight, DotFilled, Plus } from 'radix-icons-svelte';
	import type { ComponentProps } from 'svelte';
	import { fade } from 'svelte/transition';

	export let tmdbId: number;

	const itemStore = createLibraryItemStore(tmdbId);

	let seasonSelectVisible = false;
	let visibleSeasonNumber: number | undefined = undefined;
	let visibleEpisodeNumber: number | undefined = undefined;

	let requestModalVisible = false;
	const requestModalProps = createModalProps(() => (requestModalVisible = false));

	let episodeProps: ComponentProps<EpisodeCard>[][] = [];
	let nextJellyfinEpisode: JellyfinItem | undefined = undefined;

	const tmdbSeriesPromise = getTmdbSeries(tmdbId);
	const tmdbSeasonsPromise = tmdbSeriesPromise.then((s) =>
		getTmdbSeriesSeasons(tmdbId, s?.number_of_seasons || 0)
	);

	const tmdbRecommendationProps = getTmdbSeriesRecommendations(tmdbId).then((r) =>
		Promise.all(r.map(fetchCardTmdbProps))
	);
	const tmdbSimilarProps = getTmdbSeriesSimilar(tmdbId)
		.then((r) => Promise.all(r.map(fetchCardTmdbProps)))
		.then((r) => r.filter((p) => p.backdropUri));
	const castProps: Promise<ComponentProps<PeopleCard>[]> = tmdbSeriesPromise.then((s) =>
		Promise.all(
			s?.aggregate_credits?.cast?.map((m) => ({
				tmdbId: m.id || 0,
				name: m.name || '',
				backdropUri: m.profile_path || '',
				department: m.known_for_department || ''
			})) || []
		)
	);

	itemStore.subscribe(async (libraryItem) => {
		const tmdbSeasons = await tmdbSeasonsPromise;

		tmdbSeasons.forEach((season) => {
			const episodes: ComponentProps<EpisodeCard>[] = [];
			season?.episodes?.forEach((tmdbEpisode) => {
				const jellyfinEpisode = libraryItem.item?.jellyfinEpisodes?.find(
					(e) =>
						e?.IndexNumber === tmdbEpisode?.episode_number &&
						e?.ParentIndexNumber === tmdbEpisode?.season_number
				);

				if (!nextJellyfinEpisode && jellyfinEpisode?.UserData?.Played === false)
					nextJellyfinEpisode = jellyfinEpisode;

				episodes.push({
					title: tmdbEpisode?.name || '',
					subtitle: `Episode ${tmdbEpisode?.episode_number}`,
					backdropPath: tmdbEpisode?.still_path || '',
					progress: jellyfinEpisode?.UserData?.PlayedPercentage || 0,
					handlePlay: jellyfinEpisode?.Id
						? () => playerState.streamJellyfinId(jellyfinEpisode?.Id || '')
						: undefined
				});
			});
			episodeProps[season?.season_number || 0] = episodes;
		});

		visibleSeasonNumber = nextJellyfinEpisode?.ParentIndexNumber || visibleSeasonNumber || 1;
	});

	function playNextEpisode() {
		if (nextJellyfinEpisode?.Id) playerState.streamJellyfinId(nextJellyfinEpisode?.Id || '');
	}

	async function refresh() {
		await library.refresh();
	}

	let addToRadarrLoading = false;
	function addToSonarr() {
		addToRadarrLoading = true;
		addSeriesToSonarr(tmdbId)
			.then(refresh)
			.finally(() => (addToRadarrLoading = false));
	}
</script>

{#await tmdbSeriesPromise then series}
	<div class="flex flex-col max-h-screen bg-black pb-2" transition:fade>
		<div
			style={"background-image: url('" + TMDB_IMAGES_ORIGINAL + series?.backdrop_path + "')"}
			class="flex-shrink relative flex pt-24 aspect-video min-h-[70vh] p-8 bg-center bg-cover w-screen sm:bg-fixed"
		>
			<div class="absolute inset-0 bg-gradient-to-t from-black to-50% to-darken" />
			<div class="z-[1] flex-1 flex justify-end gap-8 items-end">
				<div
					class="aspect-[2/3] w-52 bg-center bg-cover rounded-md hidden sm:block"
					style={"background-image: url('" + TMDB_POSTER_SMALL + series?.poster_path + "')"}
				/>
				<div class="flex-1 flex gap-4 justify-between flex-col lg:flex-row lg:items-end">
					<div>
						<div class="text-zinc-300 text-sm uppercase font-semibold flex items-center gap-1">
							<p class="flex-shrink-0">
								{new Date(series?.first_air_date || Date.now()).getFullYear()}
							</p>
							<DotFilled />
							<p class="flex-shrink-0">{series?.status}</p>
							<DotFilled />
							<p class="flex-shrink-0">{series?.vote_average?.toFixed(1)} TMDB</p>
							<!-- <DotFilled />
							<p class="line-clamp-1">{series?.genres?.map((g) => g.name).join(', ')}</p> -->
						</div>
						<h1 class="text-4xl sm:text-5xl md:text-6xl font-semibold">{series?.name}</h1>
					</div>
					<div class="flex-shrink-0">
						{#if $itemStore.loading}
							<div class="placeholder h-10 w-48 rounded-xl" />
						{:else if $itemStore.item?.sonarrSeries?.statistics?.sizeOnDisk}
							<Button type="primary" on:click={playNextEpisode}>
								<span>Next Episode</span><ChevronRight size={20} />
							</Button>
						{:else if !$itemStore.item?.sonarrSeries}
							<Button type="primary" disabled={addToRadarrLoading} on:click={addToSonarr}>
								<span>Add to Sonarr</span><Plus size={20} />
							</Button>
						{:else}
							<Button type="primary" on:click={() => (requestModalVisible = true)}>
								<span class="mr-2">Request Series</span><Plus size={20} />
							</Button>
						{/if}
					</div>
				</div>
			</div>
		</div>
		<div>
			<Carousel gradientFromColor="from-black">
				<UiCarousel slot="title" class="flex gap-6">
					{#each [...Array(series?.number_of_seasons || 0).keys()].map((i) => i + 1) as seasonNumber}
						{@const season = series?.seasons?.find((s) => s.season_number === seasonNumber)}
						{@const isSelected = season?.season_number === (visibleSeasonNumber || 1)}
						<button
							class={classNames(
								'text-lg font-medium tracking-wide transition-colors flex-shrink-0 flex items-center gap-1',
								{
									'text-zinc-200': isSelected && seasonSelectVisible,
									'text-zinc-500 hover:text-zinc-200 cursor-pointer':
										(!isSelected || seasonSelectVisible === false) &&
										series?.number_of_seasons !== 1,
									'text-zinc-500 cursor-default': series?.number_of_seasons === 1,
									hidden:
										!seasonSelectVisible && visibleSeasonNumber !== (season?.season_number || 1)
								}
							)}
							on:click={() => {
								if (series?.number_of_seasons === 1) return;

								if (seasonSelectVisible) {
									visibleSeasonNumber = season?.season_number || 1;
									seasonSelectVisible = false;
								} else {
									seasonSelectVisible = true;
								}
							}}
						>
							<ChevronLeft
								size={22}
								class={(seasonSelectVisible || series?.number_of_seasons === 1) && 'hidden'}
							/>
							Season {season?.season_number}
						</button>
					{/each}
				</UiCarousel>
				{#key visibleSeasonNumber}
					{#each episodeProps[visibleSeasonNumber || 1] || [] as props, i}
						<div class="flex flex-col gap-3" id={'episode-card-' + (i + 1)}>
							<EpisodeCard {...props} on:click={() => (visibleEpisodeNumber = i)} />
						</div>
					{:else}
						<CarouselPlaceholderItems />
					{/each}
				{/key}
			</Carousel>
		</div>
	</div>

	<div class="flex flex-col py-4 gap-8 bg-black">
		<div
			class="mx-8 p-6 px-10 grid grid-cols-4 sm:grid-cols-6 gap-4 sm:gap-x-8 bg-zinc-900 rounded-xl"
		>
			{#if visibleEpisodeNumber !== undefined}
				{#await tmdbSeasonsPromise.then((season) => season?.[visibleSeasonNumber ? visibleSeasonNumber - 1 : 0]?.episodes?.[visibleEpisodeNumber || 0]) then episode}
					<div class="flex flex-col gap-3 max-w-5xl items-start">
						<button
							class="flex items-center text-zinc-400 text-sm"
							on:click={() => (visibleEpisodeNumber = undefined)}><ChevronLeft />Back</button
						>
						<h1 class="font-semibold text-2xl">
							{episode?.name || 'Episode ' + episode?.episode_number}
						</h1>
						<p class="pl-4 border-l-2">{episode?.overview}</p>
					</div>
				{/await}
			{:else}
				<div
					class="flex flex-col gap-3 max-w-5xl row-span-3 col-span-4 sm:col-span-6 lg:col-span-3 mb-4 lg:mr-8"
				>
					<div class="flex gap-4 justify-between">
						<h1 class="font-semibold text-2xl">{series?.tagline || series?.name}</h1>
						<!-- <div class="flex items-center gap-4">
						<a
							target="_blank"
							href={'https://www.themoviedb.org/tv/' + tmdbId}
							class="opacity-60 hover:opacity-100"
						>
							<img src="/tmdb.svg" alt="tmdb" width="25px" />
						</a>
						{#if $itemStore.item?.sonarrSeries?.titleSlug}
							<a
								target="_blank"
								href={PUBLIC_SONARR_BASE_URL +
									'/series/' +
									$itemStore.item?.sonarrSeries?.titleSlug}
								class="opacity-60 hover:opacity-100"
							>
								<img src="/sonarr.svg" alt="sonarr" width="15px" />
							</a>
						{/if}
						{#if series?.homepage}
							<a
								target="_blank"
								href={series.homepage}
								class="flex gap-1 items-center opacity-60 hover:opacity-100"
							>
								<Globe size={15} />
							</a>
						{/if} -->
					</div>
					<p class="pl-4 border-l-2">{series?.overview}</p>
				</div>

				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">Created By</p>
					<h2 class="font-medium">{series?.created_by?.map((c) => c.name).join(', ')}</h2>
				</div>
				{#if series?.first_air_date}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">First Air Date</p>
						<h2 class="font-medium">
							{new Date(series?.first_air_date).toLocaleDateString('en', {
								year: 'numeric',
								month: 'short',
								day: 'numeric'
							})}
						</h2>
					</div>
				{/if}
				{#if series?.next_episode_to_air}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">Next Air Date</p>
						<h2 class="font-medium">
							{new Date(series.next_episode_to_air?.air_date).toLocaleDateString('en', {
								year: 'numeric',
								month: 'short',
								day: 'numeric'
							})}
						</h2>
					</div>
				{:else if series?.last_air_date}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">Last Air Date</p>
						<h2 class="font-medium">
							{new Date(series.last_air_date).toLocaleDateString('en', {
								year: 'numeric',
								month: 'short',
								day: 'numeric'
							})}
						</h2>
					</div>
				{/if}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">Networks</p>
					<h2 class="font-medium">{series?.networks?.map((n) => n.name).join(', ')}</h2>
				</div>
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">Episode Run Time</p>
					<h2 class="font-medium">{series?.episode_run_time} Minutes</h2>
				</div>
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">Spoken Languages</p>
					<h2 class="font-medium">
						{series?.spoken_languages?.map((l) => capitalize(l.name || '')).join(', ')}
					</h2>
				</div>

				{#if $itemStore.loading}
					<div class="flex gap-4 flex-wrap col-span-4 sm:col-span-6 mt-4">
						<div class="placeholder h-10 w-48 rounded-xl" />
						<div class="placeholder h-10 w-48 rounded-xl" />
					</div>
				{:else}
					{@const item = $itemStore.item}
					{#if !!item?.sonarrSeries}
						{#if item.sonarrSeries.statistics?.episodeFileCount}
							<div class="col-span-2 lg:col-span-1">
								<p class="text-zinc-400 text-sm">Available</p>
								<h2 class="font-medium">
									{item.sonarrSeries.statistics?.episodeFileCount || 0} Episodes
								</h2>
							</div>
						{/if}
						{#if item.sonarrSeries.statistics?.sizeOnDisk}
							<div class="col-span-2 lg:col-span-1">
								<p class="text-zinc-400 text-sm">Size On Disk</p>
								<h2 class="font-medium">
									{formatSize(item.sonarrSeries.statistics?.sizeOnDisk || 0)}
								</h2>
							</div>
						{/if}
						{#if $itemStore.item?.download}
							<div class="col-span-2 lg:col-span-1">
								<p class="text-zinc-400 text-sm">Download Completed In</p>
								<h2 class="font-medium">
									{formatMinutesToTime(
										(new Date($itemStore.item?.download.completionTime).getTime() - Date.now()) /
											1000 /
											60
									)}
								</h2>
							</div>
						{/if}

						<div class="flex gap-4 flex-wrap col-span-4 sm:col-span-6 mt-4">
							<Button on:click={() => (requestModalVisible = true)}>
								<span class="mr-2">Request Series</span><Plus size={20} />
							</Button>
							<Button>
								<span class="mr-2">Manage</span><Archive size={20} />
							</Button>
						</div>
					{:else}
						<!-- <div
							class="flex-1 flex justify-between py-2 gap-4 items-start sm:items-center flex-col sm:flex-row"
						>
							<div>
								<h1 class="font-medium text-lg">No sources found</h1>
								<p class="text-sm text-zinc-400">Check your source settings</p>
							</div>
							<Button type="secondary"><span>Add to Sonarr</span><Plus size={20} /></Button>
						</div> -->
					{/if}
				{/if}
			{/if}
		</div>
		<div>
			<Carousel gradientFromColor="from-black">
				<div slot="title" class="font-medium text-lg">Cast & Crew</div>
				{#await castProps}
					<CarouselPlaceholderItems />
				{:then props}
					{#each props as prop}
						<PeopleCard {...prop} />
					{/each}
				{/await}
			</Carousel>
		</div>
		<div>
			<Carousel gradientFromColor="from-black">
				<div slot="title" class="font-medium text-lg">Recommendations</div>
				{#await tmdbRecommendationProps}
					<CarouselPlaceholderItems />
				{:then props}
					{#each props as prop}
						<Card {...prop} />
					{/each}
				{/await}
			</Carousel>
		</div>
		<div>
			<Carousel gradientFromColor="from-black">
				<div slot="title" class="font-medium text-lg">Similar Series</div>
				{#await tmdbSimilarProps}
					<CarouselPlaceholderItems />
				{:then props}
					{#each props as prop}
						<Card {...prop} />
					{/each}
				{/await}
			</Carousel>
		</div>
	</div>
{/await}

{#if requestModalVisible}
	{@const sonarrSeries = $itemStore.item?.sonarrSeries}
	{#if sonarrSeries && sonarrSeries.id && sonarrSeries?.statistics?.seasonCount}
		<SeriesRequestModal
			modalProps={requestModalProps}
			sonarrId={sonarrSeries.id}
			seasons={sonarrSeries?.statistics.seasonCount}
			heading={sonarrSeries.title || 'Series'}
		/>
	{/if}
{/if}
