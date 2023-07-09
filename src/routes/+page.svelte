<script lang="ts">
	import { fetchTmdbMovie } from '$lib/apis/tmdbApi';
	import SmallPoster from '$lib/components/Poster/Poster.svelte';
	import ResourceDetails from '$lib/components/ResourceDetails/ResourceDetails.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import ResourceDetailsControls from './ResourceDetailsControls.svelte';

	export let data: PageData;
	let movies: ReturnType<typeof fetchTmdbMovie>[] = [];

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

{#await data.streamed.continueWatching then continueWatching}
	{#if continueWatching?.items?.length}
		<div class="bg-stone-800">
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
