<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type { EpisodeRefDto } from '$lib/apis/reiverr/reiverr.openapi';
	import type { TmdbSeason } from '$lib/apis/tmdb/tmdb-api';
	import RequestRow from '$lib/components/RequestRow.svelte';
	import { episodeKey } from '$lib/queries/requests.queries';
	import { scrollElementIntoView } from '$lib/scroll-into-view';
	import { scrollIntoView, type Selectable } from '$lib/selectable';
	import { formatSize } from '$lib/utils';

	import type { SeriesData } from './episode-status';
	import EpisodeItem from './EpisodeItem.svelte';

	interface Props {
		onEnter?: ComponentProps<typeof RequestRow>['onEnter'];
		onRequest?: (detail: { episodes: EpisodeRefDto[]; requested: boolean }) => void;
		onTorrents?: (detail: { season: number; episode?: number; name: string }) => void;
		season: TmdbSeason;
		data?: SeriesData;
		/** The episodes of the series the user has watched, by `episodeKey` */
		watchedEpisodes: Set<string>;
		/** The list is entered at the heading of the season, which is in view when the list mounts */
		openAtHeading?: boolean;
	}

	let {
		season,
		data = {},
		watchedEpisodes,
		openAtHeading = false,
		onEnter,
		onRequest,
		onTorrents
	}: Props = $props();

	let heading: Selectable | undefined = $state();

	/** Focuses the season's heading at the top of the list */
	export function focus() {
		heading?.focus();
		const el = heading?.getHtmlElement();
		if (el) scrollElementIntoView(el, { top: 32 });
	}

	let seasonNumber = $derived(season.season_number ?? 0);
	let seasonName = $derived(season.name ?? `Season ${seasonNumber}`);
	let episodes = $derived(
		(season.episodes ?? []).map((e) => ({
			season: seasonNumber,
			episode: e.episode_number ?? 0,
			name: e.name ?? ''
		}))
	);
	let requestedCount = $derived(
		episodes.filter((e) => data.requests?.requests.has(episodeKey(e.season, e.episode))).length
	);
	let allRequested = $derived(episodes.length > 0 && requestedCount === episodes.length);

	let seasonPack = $derived(data.requests?.sources.get(episodeKey(seasonNumber, 0))?.release);
	// The season pack as the engine has it, once something was wanted of it
	let seasonPackTorrent = $derived(seasonPack && data.torrents?.get(seasonPack.infoHash));
	let seasonPackStatus = $derived(
		seasonPackTorrent?.status === 'seeding'
			? `Seeding, ${formatSize(seasonPackTorrent.uploadedBytes)} uploaded`
			: seasonPackTorrent?.status === 'failed'
				? seasonPackTorrent.error
				: seasonPackTorrent?.status === 'starting' || seasonPackTorrent?.status === 'downloading'
					? `${seasonPackTorrent.peers} peers, ${formatSize(seasonPackTorrent.downloadSpeed)}/s`
					: ''
	);
</script>

<div class="mt-8 space-y-4">
	<RequestRow
		defaultFocus={openAtHeading}
		onMounted={(e) => {
			heading = e;
			// Before the list takes the focus, to where the focus of a row keeps it: the focus then has
			// nothing to scroll, and in mouse mode it does not scroll at all
			const element = e.getHtmlElement();
			if (openAtHeading && element) scrollElementIntoView(element, { top: 96, instant: true });
		}}
		subtitle={seasonPack ? seasonPack.title : 'No season pack selected'}
		status={seasonPackStatus}
		isError={seasonPackTorrent?.status === 'failed'}
		checked={allRequested}
		partiallyChecked={requestedCount > 0}
		onToggle={() =>
			onRequest?.({
				episodes: episodes.map(({ season, episode }) => ({ season, episode })),
				requested: !allRequested
			})}
		onOpen={() => onTorrents?.({ season: seasonNumber, name: seasonName })}
		onEnter={(e) => {
			scrollIntoView({ vertical: 96 })(e);
			onEnter?.(e);
		}}
	>
		<span class="text-secondary-400">S{seasonNumber}</span>
		Season pack
	</RequestRow>

	{#each episodes as episode (episode.episode)}
		{@const requested = !!data.requests?.requests.has(episodeKey(episode.season, episode.episode))}
		<EpisodeItem
			seasonNumber={episode.season}
			episodeNumber={episode.episode}
			episodeName={episode.name}
			watched={watchedEpisodes.has(episodeKey(episode.season, episode.episode))}
			{data}
			onToggle={() =>
				onRequest?.({
					episodes: [{ season: episode.season, episode: episode.episode }],
					requested: !requested
				})}
			onOpen={() =>
				onTorrents?.({
					season: episode.season,
					episode: episode.episode,
					name: `S${episode.season}E${episode.episode} - ${episode.name}`
				})}
			onEnter={(e) => {
				scrollIntoView({ vertical: 96 })(e);
				onEnter?.(e);
			}}
		/>
	{/each}
</div>
