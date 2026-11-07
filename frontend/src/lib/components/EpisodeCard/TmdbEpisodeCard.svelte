<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type { MediaStatusTags } from '$lib/components/status-tags';
	import type { TmdbSeasonEpisode, TmdbSeries } from '../../apis/tmdb/tmdb-api';
	import { TMDB_BACKDROP_SMALL } from '../../constants';
	import EpisodeCard from './EpisodeCard.svelte';

	interface Props {
		onEnter?: ComponentProps<typeof EpisodeCard>['onEnter'];
		onMounted?: ComponentProps<typeof EpisodeCard>['onMounted'];
		onClickOrSelect?: ComponentProps<typeof EpisodeCard>['onClickOrSelect'];
		onclick?: ComponentProps<typeof EpisodeCard>['onclick'];
		onSelect?: ComponentProps<typeof EpisodeCard>['onSelect'];
		onmouseenter?: ComponentProps<typeof EpisodeCard>['onmouseenter'];
		onmouseleave?: ComponentProps<typeof EpisodeCard>['onmouseleave'];
		episode: TmdbSeasonEpisode;
		series?: TmdbSeries | undefined;
		statusTags?: MediaStatusTags;
		onLongPress?: (() => void) | undefined;
		// export let handlePlay: (() => void) | undefined;
		isWatched?: boolean;
		progress?: number;
	}

	let {
		episode,
		series = undefined,
		statusTags = {},
		onLongPress = undefined,
		isWatched = false,
		progress = 0,
		onEnter,
		onMounted,
		onClickOrSelect,
		onclick,
		onSelect,
		onmouseenter,
		onmouseleave
	}: Props = $props();
</script>

<EpisodeCard
	episodeNumber={episode.episode_number || -1}
	episodeName={episode.name || ''}
	backdropUrl={TMDB_BACKDROP_SMALL + (episode.still_path || series?.backdrop_path)}
	{isWatched}
	{progress}
	{statusTags}
	{onLongPress}
	runtime={episode.runtime}
	releaseDate={episode.air_date ? new Date(episode.air_date).getTime() : 0}
	{onEnter}
	{onMounted}
	{onClickOrSelect}
	{onclick}
	{onSelect}
	{onmouseenter}
	{onmouseleave}
/>
