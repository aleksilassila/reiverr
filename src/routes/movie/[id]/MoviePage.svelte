<script lang="ts">
	import { addMovieToRadarr } from '$lib/apis/radarr/radarrApi';
	import {
		getTmdbMovie,
		getTmdbMovieRecommendations,
		getTmdbMovieSimilar
	} from '$lib/apis/tmdb/tmdbApi';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card/Card.svelte';
	import { fetchCardTmdbProps } from '$lib/components/Card/card';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import PersonCard from '$lib/components/PersonCard/PersonCard.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import RequestModal from '$lib/components/RequestModal/RequestModal.svelte';
	import OpenInButton from '$lib/components/TitlePageLayout/OpenInButton.svelte';
	import TitlePageLayout from '$lib/components/TitlePageLayout/TitlePageLayout.svelte';
	import { playerState } from '$lib/components/VideoPlayer/VideoPlayer';
	import {
		createJellyfinItemStore,
		createRadarrDownloadStore,
		createRadarrMovieStore
	} from '$lib/stores/data.store';
	import { modalStack } from '$lib/stores/modal.store';
	import { settings } from '$lib/stores/settings.store';
	import { formatMinutesToTime, formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { Archive, ChevronRight, DotFilled, Plus } from 'radix-icons-svelte';
	import type { ComponentProps } from 'svelte';

	export let tmdbId: number;
	export let isModal = false;
	export let handleCloseModal: () => void = () => {};

	const tmdbUrl = 'https://www.themoviedb.org/movie/' + tmdbId;
	const data = getTmdbMovie(tmdbId);
	const recommendationData = preloadRecommendationData();

	const jellyfinItemStore = createJellyfinItemStore(tmdbId);
	const radarrMovieStore = createRadarrMovieStore(tmdbId);
	const radarrDownloadStore = createRadarrDownloadStore(radarrMovieStore);

	async function preloadRecommendationData() {
		const tmdbRecommendationProps = getTmdbMovieRecommendations(tmdbId)
			.then((r) => Promise.all(r.map(fetchCardTmdbProps)))
			.then((r) => r.filter((p) => p.backdropUrl));
		const tmdbSimilarProps = getTmdbMovieSimilar(tmdbId)
			.then((r) => Promise.all(r.map(fetchCardTmdbProps)))
			.then((r) => r.filter((p) => p.backdropUrl));

		const castPropsPromise: Promise<ComponentProps<PersonCard>[]> = data.then((m) =>
			Promise.all(
				m?.credits?.cast?.slice(0, 20).map((m) => ({
					tmdbId: m.id || 0,
					backdropUri: m.profile_path || '',
					name: m.name || '',
					subtitle: m.character || m.known_for_department || ''
				})) || []
			)
		);

		return {
			tmdbRecommendationProps: await tmdbRecommendationProps,
			tmdbSimilarProps: await tmdbSimilarProps,
			castProps: await castPropsPromise,	
		};
	}

	function play() {
		if ($jellyfinItemStore.item?.Id) playerState.streamJellyfinId($jellyfinItemStore.item?.Id);
	}

	async function refreshRadarr() {
		await radarrMovieStore.refreshIn();
	}

	let addToRadarrLoading = false;
	function addToRadarr() {
		addToRadarrLoading = true;
		addMovieToRadarr(tmdbId)
			.then(refreshRadarr)
			.finally(() => (addToRadarrLoading = false));
	}

	function openRequestModal() {
		if (!$radarrMovieStore.item?.id) return;

		modalStack.create(RequestModal, {
			radarrId: $radarrMovieStore.item?.id
		});
	}
</script>

{#await data}
	<TitlePageLayout {isModal} {handleCloseModal} />
{:then movie }
	<TitlePageLayout
		titleInformation={{
			tmdbId,
			type: 'movie',
			title: movie?.title || 'Movie',
			backdropUriCandidates: movie?.images?.backdrops?.map((b) => b.file_path || '') || [],
			posterPath: movie?.poster_path || '',
			tagline: movie?.tagline || movie?.title || '',
			overview: movie?.overview || ''
		}}
		{isModal}
		{handleCloseModal}
	>
		<svelte:fragment slot="title-info">
			{new Date(movie?.release_date || Date.now()).getFullYear()}
			<DotFilled />
			{@const progress = $jellyfinItemStore.item?.UserData?.PlayedPercentage}
			{#if progress}
				{progress.toFixed()} min left
			{:else}
				{movie?.runtime} min
			{/if}
			<DotFilled />
			<a href={tmdbUrl} target="_blank">{movie?.vote_average?.toFixed(1)} TMDB</a>
		</svelte:fragment>
		<svelte:fragment slot="episodes-carousel">
			{@const progress = $jellyfinItemStore.item?.UserData?.PlayedPercentage}
			{#if progress}
				<div
					class={classNames('px-2 sm:px-4 lg:px-8', {
						'2xl:px-0': !isModal
					})}
				>
					<ProgressBar {progress} />
				</div>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="title-right">
			<div
				class="flex gap-2 items-center flex-row-reverse justify-end lg:flex-row lg:justify-start"
			>
				{#if $jellyfinItemStore.loading || $radarrMovieStore.loading}
					<div class="placeholder h-10 w-48 rounded-xl" />
				{:else}
					{@const jellyfinItem = $jellyfinItemStore.item}
					{@const radarrMovie = $radarrMovieStore.item}
					<OpenInButton title={movie?.title} {jellyfinItem} {radarrMovie} type="movie" {tmdbId} />
					{#if jellyfinItem}
						<Button type="primary" on:click={play}>
							<span>Play</span><ChevronRight size={20} />
						</Button>
					{:else if !radarrMovie && $settings.radarr.baseUrl && $settings.radarr.apiKey}
						<Button type="primary" disabled={addToRadarrLoading} on:click={addToRadarr}>
							<span>Add to Radarr</span><Plus size={20} />
						</Button>
					{:else if radarrMovie}
						<Button type="primary" on:click={openRequestModal}>
							<span class="mr-2">Request Movie</span><Plus size={20} />
						</Button>
					{/if}
				{/if}
			</div>
		</svelte:fragment>

		<svelte:fragment slot="info-components">
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">Directed By</p>
				<h2 class="font-medium">
					{movie?.credits.crew
						?.filter((c) => c.job == 'Director')
						.map((p) => p.name)
						.join(', ')}
				</h2>
			</div>
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">Release Date</p>
				<h2 class="font-medium">
					{new Date(movie?.release_date || Date.now()).toLocaleDateString('en', {
						year: 'numeric',
						month: 'short',
						day: 'numeric'
					})}
				</h2>
			</div>
			{#if movie?.budget}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">Budget</p>
					<h2 class="font-medium">
						{movie?.budget?.toLocaleString('en-US', {
							style: 'currency',
							currency: 'USD'
						})}
					</h2>
				</div>
			{/if}
			{#if movie?.revenue}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">Revenue</p>
					<h2 class="font-medium">
						{movie?.revenue?.toLocaleString('en-US', {
							style: 'currency',
							currency: 'USD'
						})}
					</h2>
				</div>
			{/if}
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">Status</p>
				<h2 class="font-medium">
					{movie?.status}
				</h2>
			</div>
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">Runtime</p>
				<h2 class="font-medium">
					{movie?.runtime} Minutes
				</h2>
			</div>
		</svelte:fragment>

		<svelte:fragment slot="servarr-components">
			{@const radarrMovie = $radarrMovieStore.item}
			{#if radarrMovie}
				{#if radarrMovie?.movieFile?.quality}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">Video</p>
						<h2 class="font-medium">
							{radarrMovie?.movieFile?.quality.quality?.name}
						</h2>
					</div>
				{/if}
				{#if radarrMovie?.movieFile?.size}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">Size On Disk</p>
						<h2 class="font-medium">
							{formatSize(radarrMovie?.movieFile?.size || 0)}
						</h2>
					</div>
				{/if}
				{#if $radarrDownloadStore.downloads?.length}
					{@const download = $radarrDownloadStore.downloads[0]}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">Downloaded In</p>
						<h2 class="font-medium">
							{download?.estimatedCompletionTime
								? formatMinutesToTime(
										(new Date(download.estimatedCompletionTime).getTime() - Date.now()) / 1000 / 60
								  )
								: 'Stalled'}
						</h2>
					</div>
				{/if}

				<div class="flex gap-4 flex-wrap col-span-4 sm:col-span-6 mt-4">
					<Button on:click={openRequestModal}>
						<span class="mr-2">Request Movie</span><Plus size={20} />
					</Button>
					<Button>
						<span class="mr-2">Manage</span><Archive size={20} />
					</Button>
				</div>
			{:else if $radarrMovieStore.loading}
				<div class="flex gap-4 flex-wrap col-span-4 sm:col-span-6 mt-4">
					<div class="placeholder h-10 w-40 rounded-xl" />
					<div class="placeholder h-10 w-40 rounded-xl" />
				</div>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="carousels">
			{#await recommendationData}
				<Carousel gradientFromColor="from-stone-950">
					<div slot="title" class="font-medium text-lg">Cast & Crew</div>
					<CarouselPlaceholderItems />
				</Carousel>

				<Carousel gradientFromColor="from-stone-950">
					<div slot="title" class="font-medium text-lg">Recommendations</div>
					<CarouselPlaceholderItems />
				</Carousel>

				<Carousel gradientFromColor="from-stone-950">
					<div slot="title" class="font-medium text-lg">Similar Series</div>
					<CarouselPlaceholderItems />
				</Carousel>
			{:then { castProps, tmdbRecommendationProps, tmdbSimilarProps }}
				{#if castProps?.length}
					<Carousel gradientFromColor="from-stone-950">
						<div slot="title" class="font-medium text-lg">Cast & Crew</div>
						{#each castProps as prop}
							<PersonCard {...prop} />
						{/each}
					</Carousel>
				{/if}

				{#if tmdbRecommendationProps?.length}
					<Carousel gradientFromColor="from-stone-950">
						<div slot="title" class="font-medium text-lg">Recommendations</div>
						{#each tmdbRecommendationProps as prop}
							<Card {...prop} openInModal={isModal} />
						{/each}
					</Carousel>
				{/if}

				{#if tmdbSimilarProps?.length}
					<Carousel gradientFromColor="from-stone-950">
						<div slot="title" class="font-medium text-lg">Similar Series</div>
						{#each tmdbSimilarProps as prop}
							<Card {...prop} openInModal={isModal} />
						{/each}
					</Carousel>
				{/if}
			{/await}
		</svelte:fragment>
	</TitlePageLayout>
{/await}
