<script lang="ts">
	import { getTmdbMovie } from '$lib/apis/tmdb/tmdbApi';
	import SmallPoster from '$lib/components/Poster/Poster.svelte';
	import ResourceDetails from '$lib/components/ResourceDetails/ResourceDetails.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import ResourceDetailsControls from './ResourceDetailsControls.svelte';
	import { library } from '$lib/stores/library.store';

	export let data: PageData;
	let movies: ReturnType<typeof getTmdbMovie>[] = [];

	let index = 0;

	function onNext() {
		index = (index + 1) % movies.length;
	}

	function onPrevious() {
		index = (index - 1 + movies.length) % movies.length;
	}

	onMount(() => {
		for (const showcase of data.showcases) {
			if (showcase.id) movies = [...movies, getTmdbMovie(showcase.id)];
		}

		library.subscribe((l) => console.log(l));
	});
</script>

{#if movies[index]}
	{#await Promise.all(movies)}
		<div class="h-screen" />
	{:then awaitedMovies}
		<ResourceDetails movie={awaitedMovies[index]}>
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
{:else}
	<div class="h-screen" />
{/if}

{#await $library then libraryData}
	{#if libraryData.movies.filter((movie) => movie.continueWatching).length}
		{@const continueWatching = libraryData.movies.filter((movie) => movie.continueWatching)}
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
