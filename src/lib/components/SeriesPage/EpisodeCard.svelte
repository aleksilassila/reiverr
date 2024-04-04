<script lang="ts">
	import type { TmdbEpisode, TmdbSeason } from '../../apis/tmdb/tmdb-api';
	import Container from '../../../Container.svelte';
	import classNames from 'classnames';
	import { TMDB_BACKDROP_SMALL } from '../../constants';

	export let episode: TmdbEpisode;
</script>

<Container
	class={classNames(
		'rounded-xl overflow-hidden',
		'h-56 w-96 px-4 py-3',
		'flex flex-col shrink-0 relative selectable'
	)}
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
</Container>
