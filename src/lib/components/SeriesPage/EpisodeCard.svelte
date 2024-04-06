<script lang="ts">
	import type { TmdbEpisode } from '../../apis/tmdb/tmdb-api';
	import Container from '../../../Container.svelte';
	import classNames from 'classnames';
	import { TMDB_BACKDROP_SMALL } from '../../constants';
	import { Play, TriangleRight } from 'radix-icons-svelte';
	import type { JellyfinItem } from '../../apis/jellyfin/jellyfin-api';
	import { playerState } from '../VideoPlayer/VideoPlayer';

	export let episode: TmdbEpisode;
	export let jellyfinEpisode: JellyfinItem | undefined;

	function handlePlay() {
		if (jellyfinEpisode?.Id) playerState.streamJellyfinId(jellyfinEpisode.Id);
	}
</script>

<Container
	class={classNames(
		'rounded-xl overflow-hidden cursor-pointer group',
		'w-[420px] h-[236.25px] px-4 py-3',
		'flex flex-col shrink-0 relative selectable'
	)}
	let:hasFocus
	on:select={handlePlay}
>
	<div class="flex-1 flex flex-col justify-end z-10">
		<h2 class="text-zinc-300 font-medium">Episode {episode.episode_number}</h2>
		<h1 class="text-zinc-100 text-lg font-medium line-clamp-2">{episode.name}</h1>
	</div>
	<div
		class="absolute inset-0 bg-center bg-cover"
		style={`background-image: url('${TMDB_BACKDROP_SMALL + episode.still_path}')`}
	/>
	<div
		class="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent via-40% to-transparent"
	/>
	{#if jellyfinEpisode}
		<div
			class={classNames(
				'opacity-0 group-hover:opacity-100 absolute inset-0 z-20 flex items-center justify-center',
				{
					'opacity-100': hasFocus
				}
			)}
		>
			<div class="rounded-full bg-stone-950/50 p-2.5 cursor-pointer" on:click={handlePlay}>
				<TriangleRight size={32} />
			</div>
		</div>
	{/if}
</Container>
