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
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import DetailsPage from '$lib/components/DetailsPage/DetailsPage.svelte';
	import { createModalProps } from '$lib/components/Modal/Modal';
	import PeopleCard from '$lib/components/PeopleCard/PeopleCard.svelte';
	import RequestModal from '$lib/components/RequestModal/RequestModal.svelte';
	import { playerState } from '$lib/components/VideoPlayer/VideoPlayer';
	import { createLibraryItemStore, library } from '$lib/stores/library.store';
	import { formatMinutesToTime, formatSize } from '$lib/utils';
	import { Archive, ChevronRight, Plus } from 'radix-icons-svelte';
	import type { ComponentProps } from 'svelte';

	export let tmdbId: number;

	const itemStore = createLibraryItemStore(tmdbId);

	let requestModalVisible = false;
	const requestModalProps = createModalProps(() => (requestModalVisible = false));

	const tmdbMoviePromise = getTmdbMovie(tmdbId);
	const tmdbRecommendationProps = getTmdbMovieRecommendations(tmdbId)
		.then((r) => Promise.all(r.map(fetchCardTmdbProps)))
		.then((r) => r.filter((p) => p.backdropUri));
	const tmdbSimilarProps = getTmdbMovieSimilar(tmdbId)
		.then((r) => Promise.all(r.map(fetchCardTmdbProps)))
		.then((r) => r.filter((p) => p.backdropUri));
	const castProps: Promise<ComponentProps<PeopleCard>[]> = tmdbMoviePromise.then((m) =>
		Promise.all(
			m?.credits?.cast?.map((m) => ({
				tmdbId: m.id || 0,
				name: m.name || '',
				backdropUri: m.profile_path || '',
				department: m.known_for_department || ''
			})) || []
		)
	);

	function stream() {
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
</script>

{#await tmdbMoviePromise then movie}
	<DetailsPage
		title={movie?.title || 'Movie'}
		backdropPath={movie?.backdrop_path || ''}
		posterPath={movie?.poster_path || ''}
		tagline={movie?.tagline || movie?.title || ''}
		overview={movie?.overview || ''}
	>
		<svelte:fragment slot="title-info-1"
			>{new Date(movie?.release_date || Date.now()).getFullYear()}</svelte:fragment
		>
		<svelte:fragment slot="title-info-2">{movie?.runtime} min</svelte:fragment>
		<svelte:fragment slot="title-info-3">{movie?.vote_average?.toFixed(1)} TMDB</svelte:fragment>
		<svelte:fragment slot="episodes-carousel">
			{@const progress = $itemStore.item?.continueWatching?.progress}
			{#if progress}
				<div
					class="h-1 bg-zinc-800 rounded-full overflow-hidden group-hover:opacity-0 transition-opacity mx-4 sm:mx-8"
				>
					<div style={'width: ' + progress + '%'} class="h-full bg-zinc-400" />
				</div>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="title-right">
			{#if $itemStore.loading}
				<div class="placeholder h-10 w-48 rounded-xl" />
			{:else if $itemStore.item?.jellyfinItem}
				<Button type="primary" on:click={stream}>
					<span>Stream</span><ChevronRight size={20} />
				</Button>
			{:else if !$itemStore.item?.radarrMovie}
				<Button type="primary" disabled={addToRadarrLoading} on:click={addToRadarr}>
					<span>Add to Radarr</span><Plus size={20} />
				</Button>
			{:else}
				<Button type="primary" on:click={() => (requestModalVisible = true)}>
					<span class="mr-2">Request Movie</span><Plus size={20} />
				</Button>
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="info-components">
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">Directed By</p>
				<h2 class="font-medium">
					{movie?.credits.crew?.filter((c) => c.job == 'Director').map((p) => p.name)}
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
					<Card {...prop} />
				{/each}
			{/await}
		</svelte:fragment>

		<div slot="similar-carousel-title" class="font-medium text-lg">Similar Titles</div>
		<svelte:fragment slot="similar-carousel">
			{#await tmdbSimilarProps}
				<CarouselPlaceholderItems />
			{:then props}
				{#each props as prop}
					<Card {...prop} />
				{/each}
			{/await}
		</svelte:fragment>
	</DetailsPage>
{/await}

{#if requestModalVisible}
	{@const radarrMovie = $itemStore.item?.radarrMovie}
	{#if radarrMovie && radarrMovie.id && radarrMovie?.movieFile}
		<RequestModal modalProps={requestModalProps} radarrId={radarrMovie.id} />
	{/if}
{/if}
