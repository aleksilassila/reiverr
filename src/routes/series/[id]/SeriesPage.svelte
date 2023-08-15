<script lang="ts">
	import type { JellyfinItem } from '$lib/apis/jellyfin/jellyfinApi';
	import { addSeriesToSonarr, sonarrAvailable } from '$lib/apis/sonarr/sonarrApi';
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
	import { modalStack } from '$lib/components/Modal/Modal';
	import PeopleCard from '$lib/components/PeopleCard/PeopleCard.svelte';
	import SeriesRequestModal from '$lib/components/RequestModal/SeriesRequestModal.svelte';
	import OpenInButton from '$lib/components/TitlePageLayout/OpenInButton.svelte';
	import TitlePageLayout from '$lib/components/TitlePageLayout/TitlePageLayout.svelte';
	import { playerState } from '$lib/components/VideoPlayer/VideoPlayer';
	import { createLibraryItemStore, library } from '$lib/stores/library.store';
	import { capitalize, formatMinutesToTime, formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { Archive, ChevronLeft, ChevronRight, Plus } from 'radix-icons-svelte';
	import type { ComponentProps } from 'svelte';

	export let tmdbId: number;
	export let isModal = false;
	export let handleCloseModal: () => void = () => {};
	const tmdbUrl = 'https://www.themoviedb.org/tv/' + tmdbId;

	const itemStore = createLibraryItemStore(tmdbId);

	let seasonSelectVisible = false;
	let visibleSeasonNumber: number | undefined = undefined;
	let visibleEpisodeIndex: number | undefined = undefined;

	function openRequestModal() {
		if (
			!$itemStore.item?.sonarrSeries?.id ||
			!$itemStore.item?.sonarrSeries?.statistics?.seasonCount
		)
			return;

		modalStack.create(SeriesRequestModal, {
			sonarrId: $itemStore.item?.sonarrSeries?.id || 0,
			seasons: $itemStore.item?.sonarrSeries?.statistics?.seasonCount || 0,
			heading: $itemStore.item?.sonarrSeries?.title || 'Series'
		});
	}

	let episodeProps: ComponentProps<EpisodeCard>[][] = [];
	let episodeComponents: HTMLDivElement[] = [];
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
		.then((r) => r.filter((p) => p.backdropUrl));
	const castProps: Promise<ComponentProps<PeopleCard>[]> = tmdbSeriesPromise.then((s) =>
		Promise.all(
			s?.aggregate_credits?.cast?.slice(0, 20)?.map((m) => ({
				tmdbId: m.id || 0,
				backdropUri: m.profile_path || '',
				name: m.name || '',
				subtitle: m.roles?.[0]?.character || m.known_for_department || ''
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
				const jellyfinEpisodeId = jellyfinEpisode?.Id;

				if (!nextJellyfinEpisode && jellyfinEpisode?.UserData?.Played === false) {
					nextJellyfinEpisode = jellyfinEpisode;
				}

				episodes.push({
					title: tmdbEpisode?.name || '',
					subtitle: `Episode ${tmdbEpisode?.episode_number}`,
					backdropPath: tmdbEpisode?.still_path || '',
					progress: jellyfinEpisode?.UserData?.PlayedPercentage || 0,
					watched: jellyfinEpisode?.UserData?.Played || false,
					jellyfinId: jellyfinEpisodeId
				});
			});
			episodeProps[season?.season_number || 0] = episodes;
		});

		if (!nextJellyfinEpisode) nextJellyfinEpisode = libraryItem.item?.jellyfinEpisodes?.[0];
		visibleSeasonNumber = nextJellyfinEpisode?.ParentIndexNumber || visibleSeasonNumber || 1;
	});

	function playNextEpisode() {
		if (nextJellyfinEpisode?.Id) playerState.streamJellyfinId(nextJellyfinEpisode?.Id || '');
	}

	async function refresh() {
		await library.refresh();
	}

	let addToSonarrLoading = false;
	function addToSonarr() {
		addToSonarrLoading = true;
		addSeriesToSonarr(tmdbId)
			.then(refresh)
			.finally(() => (addToSonarrLoading = false));
	}

	let didFocusNextEpisode = false;
	$: {
		if (episodeComponents && !didFocusNextEpisode) {
			const episodeComponent = nextJellyfinEpisode?.IndexNumber
				? episodeComponents[nextJellyfinEpisode?.IndexNumber - 1]
				: undefined;

			if (episodeComponent && nextJellyfinEpisode?.ParentIndexNumber === visibleSeasonNumber) {
				const parent = episodeComponent.offsetParent;

				if (parent) {
					parent.scrollTo({
						left:
							episodeComponent.offsetLeft -
							document.body.clientWidth / 2 +
							episodeComponent.clientWidth / 2,
						behavior: 'smooth'
					});

					didFocusNextEpisode = true;
				}
			}
		}
	}
</script>

{#await tmdbSeriesPromise then series}
	<TitlePageLayout
		{tmdbId}
		type="series"
		{isModal}
		{handleCloseModal}
		backdropUriCandidates={series?.images?.backdrops?.map((b) => b.file_path || '') || []}
		posterPath={series?.poster_path || ''}
		title={series?.name || ''}
		tagline={series?.tagline || series?.name || ''}
		overview={series?.overview || ''}
	>
		<svelte:fragment slot="title-info-1">
			{new Date(series?.first_air_date || Date.now()).getFullYear()}
		</svelte:fragment>
		<svelte:fragment slot="title-info-2">{series?.status}</svelte:fragment>
		<svelte:fragment slot="title-info-3">
			<a href={tmdbUrl} target="_blank">{series?.vote_average?.toFixed(1)} TMDB</a>
		</svelte:fragment>

		<svelte:fragment slot="title-right">
			<div
				class="flex gap-2 items-center flex-row-reverse justify-end lg:flex-row lg:justify-start"
			>
				{#if $itemStore.loading}
					<div class="placeholder h-10 w-48 rounded-xl" />
				{:else}
					<OpenInButton title={series?.name} {itemStore} type="series" {tmdbId} />
					{#if $itemStore.item?.jellyfinEpisodes?.length && !!nextJellyfinEpisode}
						<Button type="primary" on:click={playNextEpisode}>
							<span>
								Watch {`S${nextJellyfinEpisode?.ParentIndexNumber}E${nextJellyfinEpisode?.IndexNumber}`}
							</span>
							<ChevronRight size={20} />
						</Button>
					{:else if !$itemStore.item?.sonarrSeries && sonarrAvailable}
						<Button type="primary" disabled={addToSonarrLoading} on:click={addToSonarr}>
							<span>Add to Sonarr</span><Plus size={20} />
						</Button>
					{:else if $itemStore.item?.sonarrSeries}
						<Button type="primary" on:click={openRequestModal}>
							<span class="mr-2">Request Series</span><Plus size={20} />
						</Button>
					{/if}
				{/if}
			</div>
		</svelte:fragment>

		<div slot="episodes-carousel">
			<Carousel
				gradientFromColor="from-stone-950"
				class={classNames('px-2 sm:px-4 lg:px-8', {
					'2xl:px-0': !isModal
				})}
			>
				<UiCarousel slot="title" class="flex gap-6">
					{#each [...Array(series?.number_of_seasons || 0).keys()].map((i) => i + 1) as seasonNumber}
						{@const season = series?.seasons?.find((s) => s.season_number === seasonNumber)}
						{@const isSelected = season?.season_number === (visibleSeasonNumber || 1)}
						<button
							class={classNames(
								'font-medium tracking-wide transition-colors flex-shrink-0 flex items-center gap-1',
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
								size={20}
								class={(seasonSelectVisible || series?.number_of_seasons === 1) && 'hidden'}
							/>
							Season {season?.season_number}
						</button>
					{/each}
				</UiCarousel>
				{#key visibleSeasonNumber}
					{#each episodeProps[visibleSeasonNumber || 1] || [] as props, i}
						<div bind:this={episodeComponents[i]}>
							<EpisodeCard {...props} on:click={() => (visibleEpisodeIndex = i)} />
						</div>
					{:else}
						<CarouselPlaceholderItems />
					{/each}
				{/key}
			</Carousel>
		</div>

		<svelte:fragment slot="info-components">
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
					{series?.spoken_languages?.map((l) => capitalize(l.english_name || '')).join(', ')}
				</h2>
			</div>
		</svelte:fragment>

		<svelte:fragment slot="servarr-components">
			{#if !$itemStore.loading && $itemStore.item?.sonarrSeries}
				{@const item = $itemStore.item}
				{#if item.sonarrSeries?.statistics?.episodeFileCount}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">Available</p>
						<h2 class="font-medium">
							{item.sonarrSeries?.statistics?.episodeFileCount || 0} Episodes
						</h2>
					</div>
				{/if}
				{#if item.sonarrSeries?.statistics?.sizeOnDisk}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">Size On Disk</p>
						<h2 class="font-medium">
							{formatSize(item.sonarrSeries?.statistics?.sizeOnDisk || 0)}
						</h2>
					</div>
				{/if}
				{#if $itemStore.item?.download}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">Download Completed In</p>
						<h2 class="font-medium">
							{$itemStore.item?.download.completionTime
								? formatMinutesToTime(
										(new Date($itemStore.item?.download.completionTime).getTime() - Date.now()) /
											1000 /
											60
								  )
								: 'Stalled'}
						</h2>
					</div>
				{/if}

				<div class="flex gap-4 flex-wrap col-span-4 sm:col-span-6 mt-4">
					<Button on:click={openRequestModal}>
						<span class="mr-2">Request Series</span><Plus size={20} />
					</Button>
					<Button>
						<span class="mr-2">Manage</span><Archive size={20} />
					</Button>
				</div>
			{:else if $itemStore.loading}
				<div class="flex gap-4 flex-wrap col-span-4 sm:col-span-6 mt-4">
					<div class="placeholder h-10 w-40 rounded-xl" />
					<div class="placeholder h-10 w-40 rounded-xl" />
				</div>
			{/if}
		</svelte:fragment>

		<div slot="cast-crew-carousel-title" class="font-medium text-lg">Cast & Crew</div>
		<svelte:fragment slot="cast-crew-carousel">
			{#await castProps}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop}
					<PeopleCard {...prop} />
				{/each}
			{/await}
		</svelte:fragment>

		<div slot="recommendations-carousel-title" class="font-medium text-lg">Recommendations</div>
		<svelte:fragment slot="recommendations-carousel">
			{#await tmdbRecommendationProps}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop}
					<Card {...prop} openInModal={isModal} />
				{/each}
			{/await}
		</svelte:fragment>

		<div slot="similar-carousel-title" class="font-medium text-lg">Similar Series</div>
		<svelte:fragment slot="similar-carousel">
			{#await tmdbSimilarProps}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop}
					<Card {...prop} openInModal={isModal} />
				{/each}
			{/await}
		</svelte:fragment>
	</TitlePageLayout>
{/await}
