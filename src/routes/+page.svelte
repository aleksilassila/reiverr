<script lang="ts">
	import { getPopular } from '$lib/graphql';
	import { ChevronDown, ChevronLeft, ChevronRight, Dot, DotFilled } from 'radix-icons-svelte';
	import SmallPoster from './SmallPoster.svelte';

	const popular = getPopular({});
	// let bgUrl = '';
	//
	// $: {
	// 	const popularMovie = $popular.data?.results?.movies[2];
	//
	// 	if (popularMovie) {
	// 		TmdbApi.get('/movie/' + popularMovie.tmdbId + '/images')
	// 			.then((res) => {
	// 				console.log('GOt response');
	// 				bgUrl = 'https://www.themoviedb.org/t/p/original/' + res.data.backdrops[0].file_path;
	// 			})
	// 			.catch(console.error);
	// 	}
	// }

	const backgroundUrl = 'https://www.themoviedb.org/t/p/original/5AcP07WJl1VZbnloLZrMVgYjR2s.jpg';
	$: if ($popular.data.results) console.log($popular.data.results);
</script>

<div
	class="h-screen w-screen bg-center bg-cover"
	style={"background-image: url('" + backgroundUrl + "')"}
>
	<div
		class="bg-[#070501bf] h-full w-full flex px-16 pb-12 pt-32 grid grid-cols-[1fr_max-content] grid-rows-[1fr_min-content] gap-x-16 gap-y-8 relative"
	>
		<div class="flex flex-col justify-self-start min-w-0">
			<!--					<h2 class="tracking-wider font-display font-light text-amber-200">Popular Now</h2>-->
			<!--					<h1 class="uppercase text-8xl font-bold font-display">Top Gun: Maveric</h1>-->
			<!--					<h2 class="text-zinc-300 text-sm self-end">-->
			<!--						<span class="font-bold uppercase tracking-wider">September</span> 2022-->
			<!--					</h2>-->
			<div class="relative">
				<h2 class="text-zinc-300 text-sm self-end">
					<span class="font-bold uppercase tracking-wider">September</span> 2022
				</h2>
				<h2
					class="tracking-wider font-display font-extrabold text-amber-300 absolute opacity-10 text-8xl -ml-6 mt-8"
				>
					Popular Now
				</h2>
				<h1 class="uppercase text-8xl font-bold font-display z-[1] relative">Top Gun: Maveric</h1>
			</div>

			<div class="mt-auto max-w-3xl flex flex-col gap-4">
				<div class="text-xl font-semibold tracking-wider">Feel the need... The need for speed.</div>
				<div
					class="tracking-wider text-zinc-200 font-light leading-6 pl-4 border-l-2 border-zinc-300"
				>
					After more than thirty years of service as one of the Navy’s top aviators, and dodging the
					advancement in rank that would ground him, Pete “Maverick” Mitchell finds himself training
					a detachment of TOP GUN graduates for a specialized mission the likes of which no living
					pilot has ever seen.
				</div>
			</div>
			<div class="flex gap-6 mt-10">
				<div class="flex gap-1">
					<button
						class="bg-white border-2 border-white hover:bg-amber-400 hover:border-amber-400 transition-colors text-zinc-900 px-8 py-3.5 uppercase tracking-widest font-extrabold cursor-pointer text-xs"
						>Stream</button
					>
					<div
						class="hidden items-center justify-center border-2 border-white w-10 cursor-pointer hover:bg-white hover:text-zinc-900 transition-colors"
					>
						<ChevronDown size="20" />
					</div>
				</div>
				<button
					class="border-2 border-white cursor-pointer transition-colors px-8 py-3.5 uppercase tracking-widest font-semibold text-xs hover:bg-white hover:text-black"
					>Watch Trailer</button
				>
			</div>
		</div>
		<div class="flex flex-col gap-6">
			<h3 class="text-xs tracking-wide uppercase">Details</h3>
			<div class="flex flex-col gap-1">
				<div class="tracking-widest font-extralight text-sm">Action, Drama</div>
				<div class="tracking-widest font-extralight text-sm">2h 13min</div>
				<div class="tracking-widest font-extralight text-sm">Currently <b>Streaming</b></div>
				<div class="tracking-widest font-extralight text-sm"><b>83%</b> IMDB</div>
				<div class="flex mt-4">
					<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="text-white w-4"
						><g
							><path d="M0 0h24v24H0z" fill="none" /><path
								d="M11.29 3.814l2.02 5.707.395 1.116.007-4.81.01-4.818h4.27L18 11.871c.003 5.98-.003 10.89-.015 10.9-.012.009-.209 0-.436-.027-.989-.118-2.29-.236-3.34-.282a14.57 14.57 0 0 1-.636-.038c-.003-.004-.273-.762-.776-2.184v-.004l-2.144-6.061-.34-.954-.008 4.586c-.006 4.365-.01 4.61-.057 4.61-.163 0-1.57.09-2.04.136-.308.027-.926.09-1.37.145-.446.051-.816.085-.823.078C6.006 22.77 6 17.867 6 11.883V1.002h.005V1h4.288l.028.08c.007.016.065.176.157.437l.641 1.778.173.496-.001.023z"
								fill-rule="evenodd"
								fill="currentColor"
							/></g
						></svg
					>
				</div>
			</div>
			<h3 class="text-xs tracking-wide uppercase">Starring</h3>
			<div class="flex flex-col gap-1">
				<div class="tracking-widest font-extralight text-sm">Tom Cruise</div>
				<div class="tracking-widest font-extralight text-sm">Miles Teller</div>
				<div class="tracking-widest font-extralight text-sm">Jennifer Connelly</div>
				<div class="tracking-widest font-extralight text-sm">Jon Hamm</div>
				<div class="tracking-widest font-extralight text-sm">Glen Powell</div>
			</div>
		</div>
		<div class="relative z-[1] flex gap-8 justify-between items-center col-span-2">
			<div class="p-4 cursor-pointer text-zinc-200 hover:text-zinc-100">
				<ChevronLeft size="24" />
			</div>
			<div class="flex gap-2">
				<DotFilled size="15" />
				<DotFilled size="15" class="opacity-20" />
				<DotFilled size="15" class="opacity-20" />
				<DotFilled size="15" class="opacity-20" />
				<DotFilled size="15" class="opacity-20" />
			</div>

			<div class="p-4 cursor-pointer text-zinc-200 hover:text-zinc-100">
				<ChevronRight size="24" />
			</div>
		</div>
		<div class="absolute inset-x-0 bottom-6 flex justify-center mx-auto opacity-50">
			<ChevronDown size="20" />
		</div>
	</div>
</div>

{#if $popular.loading}
	<div>Loading</div>
{:else if $popular.error}
	<div>Error: {$popular.error.message}</div>
{:else}
	<div class="" style={"background-image: url('" + backgroundUrl + "')"}>
		<div class="p-8 flex flex-col gap-6 backdrop-blur-xl bg-[#000000ee]">
			<h1 class="uppercase tracking-widest font-bold">Continue Watching</h1>
			<!--			<h1-->
			<!--				class="text-black bg-white px-6 py-3 inline-block text-xs uppercase tracking-widest font-bold self-start"-->
			<!--			>-->
			<!--				Continue Watching-->
			<!--			</h1>-->
			<!--			<h1-->
			<!--				class="text-white px-6 py-3 inline-block text-xs uppercase tracking-widest font-bold self-start border-2 border-white"-->
			<!--			>-->
			<!--				Continue Watching-->
			<!--			</h1>-->
			<div class="flex gap-4 overflow-x-scroll">
				{#each $popular.data.results.movies.splice(0, 5) as item (item.id)}
					<SmallPoster tmdbId={item.tmdbId} />
				{/each}
				{#each $popular.data.results.tvShows.splice(0, 2) as item (item.id)}
					<SmallPoster type="tv" tmdbId={item.tmdbId} />
				{/each}
			</div>
		</div>
	</div>
{/if}
