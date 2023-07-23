<script lang="ts">
	import { getTmdbMovie, type TmdbMovieFull } from '$lib/apis/tmdb/tmdbApi';
	import SmallPoster from '$lib/components/Poster/Poster.svelte';
	import ResourceDetails from '$lib/components/ResourceDetails/ResourceDetails.svelte';
	import type { PageData } from './$types';
	import ResourceDetailsControls from './ResourceDetailsControls.svelte';
	import { library } from '$lib/stores/library.store';

	export let data: PageData;
	const moviesPromise = Promise.all(
		data.showcases.map((showcase) => showcase.id && getTmdbMovie(showcase.id))
	).then((movies) => movies.filter((m): m is TmdbMovieFull => !!m));

	let index = 0;

	$: console.log(moviesPromise);

	async function onNext() {
		index = (index + 1) % (await moviesPromise).length;
	}

	async function onPrevious() {
		index = (index - 1 + (await moviesPromise).length) % (await moviesPromise).length;
	}
</script>

{#await moviesPromise}
	<div class="h-screen" />
{:then movies}
	{@const movie = movies[index]}
	<ResourceDetails
		type="movie"
		tmdbId={movie?.id || 0}
		title={movie?.title || ''}
		releaseDate={new Date(movie?.release_date || Date.now())}
		tagline={movie?.tagline || ''}
		overview={movie?.overview || ''}
		genres={movie?.genres?.map((g) => g.name || '') || []}
		runtime={movie?.runtime || 0}
		tmdbRating={movie?.vote_average || 0}
		starring={movie?.credits?.cast?.slice(0, 5)}
		videos={movie.videos?.results || []}
		backdropPath={movie?.backdrop_path || ''}
	>
		<ResourceDetailsControls
			slot="page-controls"
			{onNext}
			{onPrevious}
			{index}
			length={movies.length}
		/>
	</ResourceDetails>
{:catch err}
	Error occurred {JSON.stringify(err)}
{/await}

{#await $library then libraryData}
	{#if libraryData.itemsArray.filter((item) => item.continueWatching).length}
		{@const continueWatching = libraryData.continueWatching}
		<div class="p-8 flex flex-col gap-6 backdrop-blur-xl bg-stone-900">
			<h1 class="uppercase tracking-widest font-bold">Continue Watching</h1>
			<div class="flex gap-4 overflow-x-scroll">
				{#each continueWatching.slice(0, 5) as item (item.tmdbId)}
					<SmallPoster
						tmdbId={String(item.tmdbId)}
						progress={item.continueWatching?.progress || 0}
						length={item.continueWatching?.length}
					/>
				{/each}
			</div>
		</div>
	{/if}
{/await}
