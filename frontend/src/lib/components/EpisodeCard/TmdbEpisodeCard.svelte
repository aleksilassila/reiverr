<script lang="ts">
	import type { Request } from '$lib/stores/data/series-data.store';
	import type { TmdbSeasonEpisode, TmdbSeries } from '../../apis/tmdb/tmdb-api';
	import { TMDB_BACKDROP_SMALL } from '../../constants';
	import EpisodeCard from './EpisodeCard.svelte';

	export let episode: TmdbSeasonEpisode;
	export let series: TmdbSeries | undefined = undefined;
	export let requests: Request[] | undefined = undefined;
	// export let handlePlay: (() => void) | undefined;
	export let isWatched = false;
	export let progress = 0;
</script>

<EpisodeCard
	episodeNumber={episode.episode_number || -1}
	episodeName={episode.name || ''}
	backdropUrl={TMDB_BACKDROP_SMALL + (episode.still_path || series?.backdrop_path)}
	{isWatched}
	{progress}
	{requests}
	runtime={episode.runtime}
	releaseDate={episode.air_date ? new Date(episode.air_date).getTime() : 0}
	on:enter
	on:mount
	on:clickOrSelect
	on:click
	on:select
	on:mouseenter
	on:mouseleave
/>
