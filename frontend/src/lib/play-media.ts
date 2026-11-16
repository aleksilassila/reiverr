import type { LibraryFileDto, UpdatePlayStateDto } from '$lib/apis/reiverr/reiverr.openapi';
import { createErrorNotification } from '$lib/components/Notifications/notification.store';
import type { VideoPlayerMedia } from '$lib/components/VideoPlayer/video-player.store';
import { libraryQueries } from '$lib/queries/library.queries';
import { metadataQueries } from '$lib/queries/metadata.queries';
import { queryClient } from '$lib/queries/query-client';
import {
	saveEpisodePlayState,
	saveMoviePlayState,
	userDataQueries
} from '$lib/queries/user-data.queries';
import { sessions } from '$lib/stores/session.store';
import { get } from 'svelte/store';

const WATCHED_PROGRESS = 0.9;

type PlayMedia = (media: VideoPlayerMedia) => void;

/**
 * Plays an episode from the library with `playMedia` of the background of the page, with one video
 * track per file found. What the player shows of the episode and where the user left off are
 * looked up here. Nothing happens when the episode is not on disk, and a failure to look it up is
 * reported.
 */
export async function playEpisode(
	tmdbId: string,
	season: number,
	episode: number,
	playMedia: PlayMedia
) {
	const lookup = await Promise.all([
		// The document the page shows the series from does, however old
		queryClient.query({ ...metadataQueries.series(tmdbId), staleTime: Infinity }),
		queryClient.query(userDataQueries.series(tmdbId)),
		// Looked up again, since an import may have just added a file
		queryClient.query({
			...libraryQueries.episodeFiles(tmdbId, season, episode),
			staleTime: 0
		})
	]).catch(reportLookupFailure);
	if (!lookup) return;

	const [series, userData, files] = lookup;
	if (!files.length) return;

	const tmdbEpisode = series?.seasons
		?.flatMap((s) => s.episodes ?? [])
		.find((e) => e.season_number === season && e.episode_number === episode);
	const playState = userData.playStates.find((p) => p.season === season && p.episode === episode);

	playMedia({
		title: tmdbEpisode?.name ?? '',
		titlePrefix: `S${season}E${episode}`,
		subtitle: series?.name ?? '',
		progress: resumeProgress(playState?.progress),
		...tracksOf(files),
		onProgress: (progress) => saveEpisodePlayState(tmdbId, season, episode, playStateAt(progress))
	});
}

/**
 * Plays a movie from the library with `playMedia` of the background of the page, with one video
 * track per version found. What the player shows of the movie and where the user left off are
 * looked up here. Nothing happens when the movie is not on disk, and a failure to look it up is
 * reported.
 */
export async function playMovie(tmdbId: string, playMedia: PlayMedia) {
	const lookup = await Promise.all([
		// The document the page shows the movie from does, however old
		queryClient.query({ ...metadataQueries.movie(tmdbId), staleTime: Infinity }),
		queryClient.query(userDataQueries.movie(tmdbId)),
		// Looked up again, since an import may have just added a file
		queryClient.query({ ...libraryQueries.movieFiles(tmdbId), staleTime: 0 })
	]).catch(reportLookupFailure);
	if (!lookup) return;

	const [movie, userData, files] = lookup;
	if (!files.length) return;

	playMedia({
		title: movie?.title ?? '',
		subtitle: movie?.release_date ? String(new Date(movie.release_date).getFullYear()) : '',
		progress: resumeProgress(userData.playState?.progress),
		...tracksOf(files),
		onProgress: (progress) => saveMoviePlayState(tmdbId, playStateAt(progress))
	});
}

function reportLookupFailure(e: any) {
	createErrorNotification('Could not play', e?.response?.data?.message ?? e?.message ?? String(e));
}

/** Where playback starts, from 0 to 1: a watched title starts over instead of resuming at its end */
function resumeProgress(progress = 0): number {
	return progress >= WATCHED_PROGRESS ? 0 : progress;
}

/** What a progress report of the player saves: near its end the title becomes watched */
function playStateAt(progress: number): UpdatePlayStateDto {
	return { progress, ...(progress > WATCHED_PROGRESS && { watched: true }) };
}

/** One video track per file, with the subtitle files next to each */
function tracksOf(
	files: LibraryFileDto[]
): Pick<VideoPlayerMedia, 'videoTracks' | 'subtitleTracks'> {
	// Media elements cannot send headers, so the token travels in the URL
	const { baseUrl, token } = get(sessions).activeSession ?? { baseUrl: '', token: '' };
	const url = (path: string) => `${baseUrl}/api/library/${path}?reiverr_token=${token}`;

	return {
		videoTracks: files.map((file) => ({
			id: file.id,
			label: file.fileName,
			src: url(`files/${file.id}/stream`),
			type: 'direct'
		})),
		subtitleTracks: files.flatMap((file) =>
			file.subtitles.map((subtitle) => {
				const path = `files/${file.id}/subtitles/${encodeURIComponent(subtitle.fileName)}`;

				return { id: path, label: subtitle.label, lang: subtitle.lang, src: url(path) };
			})
		)
	};
}
