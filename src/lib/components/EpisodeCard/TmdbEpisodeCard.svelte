<script lang="ts">
	import EpisodeCard from './EpisodeCard.svelte';
	import type { TmdbSeasonEpisode, TmdbSeries2 } from '../../apis/tmdb/tmdb-api';
	import { TMDB_BACKDROP_SMALL } from '../../constants';

	export let episode: TmdbSeasonEpisode;
	export let series: TmdbSeries2 | undefined = undefined;
	export let handlePlay: (() => void) | undefined;
	export let isWatched = false;
	export let progress = 0;
</script>

<EpisodeCard
	episodeNumber={episode.episode_number || -1}
	episodeName={episode.name || ''}
	backdropUrl={TMDB_BACKDROP_SMALL + (episode.still_path || series?.backdrop_path)}
	{handlePlay}
	{isWatched}
	progress={progress}
	runtime={episode.runtime}
	on:enter
	on:mount
	on:clickOrSelect
/>
