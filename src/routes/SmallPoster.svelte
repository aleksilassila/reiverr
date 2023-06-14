<script lang="ts">
	import { TmdbApi } from '$lib/tmdb-api';
	import { onMount } from 'svelte';

	export let tmdbId;

	export let type: 'movie' | 'tv' = 'movie';

	let bg = '';
	let title = 'Loading...';

	const progress = Math.random() > 0.5 ? Math.round(Math.random() * 100) : 100;

	onMount(() => {
		TmdbApi.get('/' + type + '/' + tmdbId)
			.then((res) => res.data)
			.then((data: any) => {
				bg = 'https://www.themoviedb.org/t/p/original/' + data.poster_path;
				title = data.title;
			});
	});
</script>

<div class="group grid grid-cols-[2px_1fr_2px] grid-rows-[2px_1fr_2px]">
	<div
		style={'width: ' + progress + '%'}
		class="h-full bg-zinc-200 opacity-100 group-hover:opacity-80 transition-opacity col-span-3"
	/>
	<div
		transition-opacity
		style={'height: ' + progress + '%'}
		class="w-full bg-zinc-200 opacity-100 group-hover:opacity-80"
	/>
	<div
		class="bg-center bg-cover aspect-[2/3] h-72 shadow-2xl m-1.5"
		style={"background-image: url('" + bg + "')"}
	>
		<div
			class="w-full h-full bg-gradient-to-b from-[#00000099] via-20% via-transparent hover:bg-[#00000099] transition-all flex"
		>
			<div
				class="opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between flex-1 cursor-pointer"
			>
				<div>
					<h1 class="font-bold text-lg tracking-wide">
						{title}
					</h1>
					{#if type === 'movie'}
						<h2 class="text-xs uppercase text-zinc-300"><b>December</b> 2022</h2>
					{:else}
						<h2 class="text-xs uppercase text-zinc-300">S1 <b>E2</b></h2>
					{/if}
					{#if progress}
						<h2 class="mt-2 text-sm tracking-wide text-zinc-300"><b>30min</b> left</h2>
					{/if}
				</div>
				<div class="flex flex-col gap-2">
					<button
						class="bg-white border-2 border-white hover:bg-amber-400 hover:border-amber-400 transition-colors text-zinc-900 px-8 py-2.5 uppercase tracking-widest font-extrabold cursor-pointer text-xs"
						>Stream</button
					>
					<a
						href={'/' + type + '/' + tmdbId}
						class="border-2 border-white cursor-pointer transition-colors px-8 py-2.5 uppercase tracking-widest font-semibold text-xs hover:bg-amber-400 hover:text-black text-center"
						>Details</a
					>
				</div>
			</div>
		</div>
	</div>
	<div
		style={'height: ' + progress + '%'}
		class="w-full bg-zinc-200 opacity-100 group-hover:opacity-80 transition-opacity self-end"
	/>
	<div
		style={'width: ' + progress + '%'}
		class="h-full bg-zinc-200 opacity-100 group-hover:opacity-80 transition-opacity col-span-3 justify-self-end"
	/>
</div>
