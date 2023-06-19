<script lang="ts">
	import SmallPoster from './components/Poster/Poster.svelte';
	import type { PageData } from './$types';
	import ResourceDetails from './components/ResourceDetails/ResourceDetails.svelte';
	import ResourceDetailsControls from './ResourceDetailsControls.svelte';
	import { TMDB_IMAGES } from '$lib/constants';
	import { fetchTmdbMovie } from '$lib/tmdb-api';
	import { onMount } from 'svelte';

	export let data: PageData;
	let movies = [];

	let index = 0;

	function onNext() {
		index = (index + 1) % movies.length;
	}

	function onPrevious() {
		index = (index - 1 + movies.length) % movies.length;
	}

	onMount(() => {
		for (const showcase of data.showcases) {
			movies = [...movies, fetchTmdbMovie(String(showcase.id))];
		}
	});
</script>

<div class="h-screen">
	{#if movies[index]}
		{#await Promise.all(movies) then awaitedMovies}
			<ResourceDetails movie={awaitedMovies[index]}>
				<ResourceDetailsControls
					slot="page-controls"
					{onNext}
					{onPrevious}
					{index}
					length={movies.length}
				/>
			</ResourceDetails>
		{/await}
	{/if}
</div>

{#await data.streamed.continueWatching then continueWatching}
	{#if continueWatching?.items?.length}
		<div
			class="bg-cover bg-center"
			style={"background-image: url('" + TMDB_IMAGES + continueWatching.backdrop + "')"}
		>
			<div class="p-8 flex flex-col gap-6 backdrop-blur-xl bg-[#000000dd]">
				<h1 class="uppercase tracking-widest font-bold">Continue Watching</h1>
				<div class="flex gap-4 overflow-x-scroll">
					{#each continueWatching.items.slice(0, 5) as item (item.tmdbId)}
						<SmallPoster tmdbId={item.tmdbId} progress={item.progress || 0} length={item.length} />
					{/each}
				</div>
			</div>
		</div>
	{/if}
{/await}
