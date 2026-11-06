import type { SeriesUserDataDto, TmdbSeriesFull } from '$lib/apis/reiverr/reiverr.openapi';
import { getStatusTags, type MediaStatusTags } from '$lib/components/status-tags';
import type { TitleTorrents } from '$lib/queries/downloads.queries';
import type { SeriesStatus } from '$lib/queries/library.queries';
import { episodeKey, type SeriesRequests } from '$lib/queries/requests.queries';
import { findDownload, heldFileOf, torrentItemOf } from '$lib/request-status';

/** The three documents of a series the request views read, each as far as it has loaded */
export type SeriesData = {
	requests?: SeriesRequests;
	status?: SeriesStatus;
	torrents?: TitleTorrents;
};

export type EpisodeRequestStatus = {
	requested: boolean;
	onDisk: boolean;
	/** The torrent of the request, or else the selected one: the episode's own, or the season pack */
	infoHash?: string;
	/** The name of that torrent, or of the file selected for the episode */
	sourceName?: string;
	/** The torrent is the season pack, which was not selected for this episode */
	isSeasonPack: boolean;
	tags: MediaStatusTags;
};

export function getEpisodeRequestStatus(
	data: SeriesData,
	season: number,
	episode: number
): EpisodeRequestStatus {
	const key = episodeKey(season, episode);
	const request = data.requests?.requests.get(key);
	const fulfilment = request && data.status?.fulfilments.get(request.id);
	const files = (data.status?.files ?? []).filter(
		(file) => file.season === season && file.episodes.includes(episode)
	);
	const own = data.requests?.sources.get(key);
	const seasonPack = data.requests?.sources.get(episodeKey(season, 0));
	const selected = own ?? seasonPack;
	// A request that has its file keeps its torrent when another one is selected
	const infoHash =
		heldFileOf(fulfilment, data.status?.files)?.infoHash ?? selected?.release?.infoHash;
	const torrent = infoHash ? data.torrents?.get(infoHash) : undefined;
	const release = selected?.release?.infoHash === infoHash ? selected?.release : undefined;
	const file = own?.mediaFileId
		? data.status?.files.find((file) => file.id === own.mediaFileId)
		: undefined;

	// Without a request, the episode may download for someone else
	const download = request
		? { torrent, torrentItem: torrentItemOf(torrent, season, episode) }
		: findDownload(data.torrents, season, episode);

	return {
		requested: !!request,
		onDisk: files.length > 0,
		infoHash,
		sourceName: torrent?.title ?? release?.title ?? file?.fileName,
		isSeasonPack: !own && !!infoHash && infoHash === seasonPack?.release?.infoHash,
		tags: getStatusTags({ request, source: selected, fulfilment, files, ...download })
	};
}

export type EpisodeUserData = {
	season: number;
	episode: number;
	watched: boolean;
	progress: number;
	upcoming: boolean;
};

export type EpisodesData = {
	/** The episode after the last watched one */
	nextEpisode: EpisodeUserData | undefined;
	episodes: EpisodeUserData[];
};

/** The play state of every episode of the series, in season and episode order */
export function getEpisodeData(
	tmdbSeries?: TmdbSeriesFull,
	userData?: SeriesUserDataDto
): EpisodesData {
	let nextEpisodeData: EpisodeUserData | undefined = undefined;
	const episodesData: EpisodeUserData[] = [];
	let foundNext = false;
	const lastWatchedPlayState = userData?.playStates?.filter((p) => p.watched).pop();
	for (let season = 1; season <= (tmdbSeries?.number_of_seasons ?? 0); season++) {
		const s = tmdbSeries?.seasons?.find((s) => s.season_number === season);
		for (let episode = 1; episode <= (s?.episodes?.length ?? 0); episode++) {
			const ep = userData?.playStates?.find((p) => p.season === season && p.episode === episode);
			const upcoming = !s?.air_date || new Date(s.air_date) > new Date();

			const episodeData = {
				season,
				episode,
				watched: ep?.watched ?? false,
				progress: ep?.progress ?? 0,
				upcoming
			};

			if (
				!foundNext &&
				((lastWatchedPlayState?.season ?? Infinity) < season ||
					((lastWatchedPlayState?.season ?? Infinity) === season &&
						(lastWatchedPlayState?.episode ?? Infinity) < episode))
			) {
				nextEpisodeData = episodeData;
				foundNext = true;
			}
			episodesData.push(episodeData);
		}
	}

	return {
		nextEpisode: nextEpisodeData,
		episodes: episodesData
	};
}
