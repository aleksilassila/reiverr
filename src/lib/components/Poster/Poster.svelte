<script lang="ts">
	import { getJellyfinItemByTmdbId } from '$lib/apis/jellyfin/jellyfinApi';
	import { TmdbApi } from '$lib/apis/tmdb/tmdbApi';
	import { TMDB_IMAGES } from '$lib/constants';
	import { formatMinutesToTime } from '$lib/utils';
	import { onMount } from 'svelte';
	import { playerState } from '../VideoPlayer/VideoPlayer';

	export let tmdbId: string;
	export let progress = 0;
	export let length = 0;
	export let randomProgress = false;
	if (randomProgress) progress = Math.random() > 0.5 ? Math.round(Math.random() * 100) : 100;

	export let type: 'movie' | 'tv' = 'movie';

	let bg = '';
	let title = 'Loading...';

	onMount(() => {
		TmdbApi.get('/' + type + '/' + tmdbId)
			.then((res) => res.data)
			.then((data: any) => {
				bg = TMDB_IMAGES + data.poster_path;
				title = data.title;
			});
	});

	let streamFetching = false;
	function stream() {
		if (streamFetching || !tmdbId) return;
		streamFetching = true;
		getJellyfinItemByTmdbId(tmdbId).then((item: any) => {
			if (item.Id) playerState.streamJellyfinId(item.Id);
			streamFetching = false;
		});
	}
</script>

<div class="group grid grid-cols-[2px_1fr_2px] grid-rows-[2px_1fr_2px]">
	<div
		style={'width: ' + progress + '%'}
		class="h-full bg-zinc-200 opacity-100 group-hover:opacity-80 transition-all col-span-3"
	/>
	<div
		style={'height: ' + progress + '%'}
		class="w-full bg-zinc-200 opacity-100 group-hover:opacity-80 transition-all"
	/>
	<div
		class="bg-center bg-cover aspect-[2/3] h-72 m-1.5"
		style={"background-image: url('" + bg + "')"}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="w-full h-full hover:bg-darken transition-all flex">
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between flex-1 cursor-pointer"
				on:click={() => (window.location.href = '/' + type + '/' + tmdbId)}
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
					{#if progress && length}
						<h2 class="mt-2 text-sm tracking-wide text-zinc-300">
							<b>{formatMinutesToTime(length * (1 - progress / 100))}</b> left
						</h2>
					{/if}
				</div>
				<div class="flex flex-col gap-2">
					<button
						class="bg-white border-2 border-white hover:bg-amber-400 hover:border-amber-400 transition-colors text-zinc-900 px-8 py-2.5 uppercase tracking-widest font-extrabold cursor-pointer text-xs"
						on:click|stopPropagation={stream}>Stream</button
					>
					<a
						on:click|stopPropagation
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
		class="w-full bg-zinc-200 opacity-100 group-hover:opacity-80 transition-all self-end"
	/>
	<div
		style={'width: ' + progress + '%'}
		class="h-full bg-zinc-200 opacity-100 group-hover:opacity-80 transition-all col-span-3 justify-self-end"
	/>
</div>
