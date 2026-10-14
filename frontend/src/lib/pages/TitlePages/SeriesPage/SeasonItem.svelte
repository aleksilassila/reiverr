<script lang="ts">
	import type { EpisodeRefDto } from '$lib/apis/reiverr/reiverr.openapi';
	import type { TmdbSeason } from '$lib/apis/tmdb/tmdb-api';
	import { episodeKey, type SeriesRequests } from '$lib/stores/data/series-data.store';
	import { scrollIntoView } from '$lib/selectable';
	import { formatSize } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';
	import EpisodeItem from './EpisodeItem.svelte';
	import RequestRow from './RequestRow.svelte';

	export let season: TmdbSeason;
	export let requests: SeriesRequests | undefined = undefined;

	const dispatch = createEventDispatcher<{
		request: { episodes: EpisodeRefDto[]; requested: boolean };
		torrents: { season: number; episode?: number; name: string };
	}>();

	$: seasonNumber = season.season_number ?? 0;
	$: seasonName = season.name ?? `Season ${seasonNumber}`;
	$: episodes = (season.episodes ?? []).map((e) => ({
		season: seasonNumber,
		episode: e.episode_number ?? 0,
		name: e.name ?? ''
	}));
	$: requestedCount = episodes.filter(
		(e) => requests?.episodes.get(episodeKey(e.season, e.episode))?.requested
	).length;
	$: allRequested = episodes.length > 0 && requestedCount === episodes.length;

	$: seasonPack = requests?.preferences.get(episodeKey(seasonNumber, 0));
	$: seasonPackTorrent = seasonPack?.torrent;
	$: seasonPackStatus =
		seasonPackTorrent?.status === 'seeding'
			? `Seeding, ${formatSize(seasonPackTorrent.uploadedBytes)} uploaded`
			: seasonPackTorrent?.status === 'failed'
				? seasonPackTorrent.error
				: seasonPackTorrent && seasonPackTorrent.status !== 'stopped'
					? `${seasonPackTorrent.peers} peers, ${formatSize(seasonPackTorrent.downloadSpeed)}/s`
					: '';
</script>

<div class="mt-8 space-y-4">
	<RequestRow
		heading
		title={`${seasonName} (${episodes.length} episodes)`}
		subtitle={seasonPackTorrent
			? `${seasonPackTorrent.title}`
			: 'No season pack selected'}
		status={seasonPackStatus}
		isError={seasonPackTorrent?.status === 'failed'}
		checked={allRequested}
		partiallyChecked={requestedCount > 0}
		on:toggle={() =>
			dispatch('request', {
				episodes: episodes.map(({ season, episode }) => ({ season, episode })),
				requested: !allRequested
			})}
		on:open={() => dispatch('torrents', { season: seasonNumber, name: seasonName })}
		on:enter={scrollIntoView({ vertical: 96 })}
	/>

	{#each episodes as episode (episode.episode)}
		{@const requested = !!requests?.episodes.get(episodeKey(episode.season, episode.episode))
			?.requested}
		<EpisodeItem
			seasonNumber={episode.season}
			episodeNumber={episode.episode}
			episodeName={episode.name}
			{requests}
			on:toggle={() =>
				dispatch('request', {
					episodes: [{ season: episode.season, episode: episode.episode }],
					requested: !requested
				})}
			on:open={() =>
				dispatch('torrents', {
					season: episode.season,
					episode: episode.episode,
					name: `S${episode.season}E${episode.episode} - ${episode.name}`
				})}
			on:enter={scrollIntoView({ vertical: 96 })}
		/>
	{/each}
</div>
