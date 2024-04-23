<script lang="ts">
	import EpisodeCard from './EpisodeCard.svelte';
	import type { TmdbSeasonEpisode } from '../../apis/tmdb/tmdb-api';
	import { TMDB_BACKDROP_SMALL } from '../../constants';

	export let episode: TmdbSeasonEpisode;
	export let handlePlay: (() => void) | undefined;
	export let isWatched = false;
	export let playbackProgress = 0;
</script>

<EpisodeCard
	episodeNumber={episode.episode_number || -1}
	episodeName={episode.name || ''}
	backdropUrl={TMDB_BACKDROP_SMALL + episode.still_path}
	{handlePlay}
	{isWatched}
	{playbackProgress}
	on:enter
	on:mount
	on:clickOrSelect
/>
