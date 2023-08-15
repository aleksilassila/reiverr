<script lang="ts">
	import { addMovieToRadarr, radarrAvailable } from '$lib/apis/radarr/radarrApi';
	import {
		getTmdbMovie,
		getTmdbMovieRecommendations,
		getTmdbMovieSimilar
	} from '$lib/apis/tmdb/tmdbApi';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card/Card.svelte';
	import { fetchCardTmdbProps } from '$lib/components/Card/card';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import ContextMenuButton from '$lib/components/ContextMenu/ContextMenuButton.svelte';
	import { modalStack } from '$lib/components/Modal/Modal';
	import PeopleCard from '$lib/components/PeopleCard/PeopleCard.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import RequestModal from '$lib/components/RequestModal/RequestModal.svelte';
	import OpenInButton from '$lib/components/TitlePageLayout/OpenInButton.svelte';
	import TitlePageLayout from '$lib/components/TitlePageLayout/TitlePageLayout.svelte';
	import { playerState } from '$lib/components/VideoPlayer/VideoPlayer';
	import { createLibraryItemStore, library } from '$lib/stores/library.store';
	import { formatMinutesToTime, formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { Archive, ChevronRight, Plus } from 'radix-icons-svelte';
	import type { ComponentProps } from 'svelte';

	export let tmdbId: number;
	export let isModal = false;
	export let handleCloseModal: () => void = () => {};
	const tmdbUrl = 'https://www.themoviedb.org/movie/' + tmdbId;

	const itemStore = createLibraryItemStore(tmdbId);

	const tmdbMoviePromise = getTmdbMovie(tmdbId);
	const tmdbRecommendationProps = getTmdbMovieRecommendations(tmdbId)
		.then((r) => Promise.all(r.map(fetchCardTmdbProps)))
		.then((r) => r.filter((p) => p.backdropUrl));
	const tmdbSimilarProps = getTmdbMovieSimilar(tmdbId)
		.then((r) => Promise.all(r.map(fetchCardTmdbProps)))
		.then((r) => r.filter((p) => p.backdropUrl));
	const castProps: Promise<ComponentProps<PeopleCard>[]> = tmdbMoviePromise.then((m) =>
		Promise.all(
			m?.credits?.cast?.slice(0, 20).map((m) => ({
				tmdbId: m.id || 0,
				backdropUri: m.profile_path || '',
				name: m.name || '',
				subtitle: m.character || m.known_for_department || ''
			})) || []
		)
	);

	function play() {
		if ($itemStore.item?.jellyfinItem?.Id)
			playerState.streamJellyfinId($itemStore.item?.jellyfinItem?.Id);
	}

	async function refresh() {
		await library.refresh();
	}

	let addToRadarrLoading = false;
	function addToRadarr() {
		addToRadarrLoading = true;
		addMovieToRadarr(tmdbId)
			.then(refresh)
			.finally(() => (addToRadarrLoading = false));
	}

	function openRequestModal() {
		if (!$itemStore.item?.radarrMovie?.id) return;

		modalStack.create(RequestModal, {
			radarrId: $itemStore.item?.radarrMovie?.id
		});
	}
</script>

{#await tmdbMoviePromise then movie}
	<TitlePageLayout
		{isModal}
		{tmdbId}
		{handleCloseModal}
		type="movie"
		title={movie?.title || 'Movie'}
		backdropUriCandidates={movie?.images?.backdrops?.map((b) => b.file_path || '') || []}
		posterPath={movie?.poster_path || ''}
		tagline={movie?.tagline || movie?.title || ''}
		overview={movie?.overview || ''}
	>
		<svelte:fragment slot="title-info-1"
			>{new Date(movie?.release_date || Date.now()).getFullYear()}</svelte:fragment
		>
		<svelte:fragment slot="title-info-2">
			{@const progress = $itemStore.item?.continueWatching?.progress}
			{#if progress}
				{progress.toFixed()} min left
			{:else}
				{movie?.runtime} min
			{/if}
		</svelte:fragment>
		<svelte:fragment slot="title-info-3">
			<a href={tmdbUrl} target="_blank">{movie?.vote_average?.toFixed(1)} TMDB</a>
		</svelte:fragment>
		<svelte:fragment slot="episodes-carousel">
			{@const progress = $itemStore.item?.continueWatching?.progress}
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
				{#if $itemStore.loading}
					<div class="placeholder h-10 w-48 rounded-xl" />
				{:else}
					<OpenInButton title={movie?.title} {itemStore} type="movie" {tmdbId} />
					{#if $itemStore.item?.jellyfinItem}
						<Button type="primary" on:click={play}>
							<span>Watch</span><ChevronRight size={20} />
						</Button>
					{:else if !$itemStore.item?.radarrMovie && radarrAvailable}
						<Button type="primary" disabled={addToRadarrLoading} on:click={addToRadarr}>
							<span>Add to Radarr</span><Plus size={20} />
						</Button>
					{:else if $itemStore.item?.radarrMovie}
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
			<!-- {#if series?.first_air_date}
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
            </div> -->
		</svelte:fragment>

		<svelte:fragment slot="servarr-components">
			{#if !$itemStore.loading && $itemStore.item}
				{@const item = $itemStore.item}
				{#if item.radarrMovie?.movieFile?.quality}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">Video</p>
						<h2 class="font-medium">
							{item.radarrMovie?.movieFile?.quality.quality?.name}
						</h2>
					</div>
				{/if}
				{#if item.radarrMovie?.movieFile?.size}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">Size On Disk</p>
						<h2 class="font-medium">
							{formatSize(item.radarrMovie?.movieFile?.size || 0)}
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
						<span class="mr-2">Request Movie</span><Plus size={20} />
					</Button>
					<Button>
						<span class="mr-2">Manage</span><Archive size={20} />
					</Button>
				</div>
				<!-- <div
                    class="flex-1 flex justify-between py-2 gap-4 items-start sm:items-center flex-col sm:flex-row"
                >
                    <div>
                        <h1 class="font-medium text-lg">No sources found</h1>
                        <p class="text-sm text-zinc-400">Check your source settings</p>
                    </div>
                    <Button type="secondary"><span>Add to Sonarr</span><Plus size={20} /></Button>
                </div> -->
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

		<div slot="similar-carousel-title" class="font-medium text-lg">Similar Titles</div>
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

<!-- {#if requestModalVisible} -->
<!-- {@const radarrMovie = $itemStore.item?.radarrMovie} -->
<!-- {#if radarrMovie && radarrMovie.id} -->
<!-- <RequestModal modalProps={requestModalProps} radarrId={radarrMovie.id} /> -->
<!-- {/if} -->
<!-- {/if} -->
<!--  -->
