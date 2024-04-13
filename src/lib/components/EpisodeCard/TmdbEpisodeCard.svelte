<script lang="ts">
	import EpisodeCard from './EpisodeCard.svelte';
	import type { TmdbEpisode } from '../../apis/tmdb/tmdb-api';
	import { TMDB_BACKDROP_SMALL } from '../../constants';

	export let episode: TmdbEpisode;
	export let handlePlay: (() => void) | undefined;
</script>

<EpisodeCard
	episodeNumber={episode.episode_number || -1}
	episodeName={episode.name || ''}
	backdropUrl={TMDB_BACKDROP_SMALL + episode.still_path}
	{handlePlay}
	on:enter
	on:mount
/>
