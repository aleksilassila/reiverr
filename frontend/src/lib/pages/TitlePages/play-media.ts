import type { LibraryFileDto, UpdatePlayStateDto } from '$lib/apis/reiverr/reiverr.openapi';
import type { PlayMediaOptions } from '$lib/components/GlobalBackground/background-stack.store';
import { createErrorNotification } from '$lib/components/Notifications/notification.store';
import { sessions } from '$lib/stores/session.store';
import { reiverrApi, user } from '$lib/stores/user.store';
import { get } from 'svelte/store';

const WATCHED_PROGRESS = 0.9;

type PlayOptions = {
	title: string;
	subtitle: string;
	progress?: number;
	playMedia: (props: PlayMediaOptions) => void;
	/** Called after the play state has been saved */
	onProgressSaved?: () => void;
};

/**
 * Plays an episode from the library, with one video track per file found.
 * Nothing happens when the episode is not on disk, and a failure to look it
 * up is reported.
 *
 * @returns whether playback started
 */
export async function playEpisode(
	options: PlayOptions & { tmdbId: string; season: number; episode: number }
): Promise<boolean> {
	const { tmdbId, season, episode } = options;

	const files = await reiverrApi.library
		.getEpisodeFiles(tmdbId, season, episode)
		.then((r) => r.data)
		.catch(reportLookupFailure);

	return playFiles(files, options, (userId, playState) =>
		reiverrApi.users.updateEpisodePlayState(userId, tmdbId, season, episode, playState)
	);
}

/**
 * Plays a movie from the library, with one video track per version found.
 * Nothing happens when the movie is not on disk, and a failure to look it
 * up is reported.
 *
 * @returns whether playback started
 */
export async function playMovie(options: PlayOptions & { tmdbId: string }): Promise<boolean> {
	const { tmdbId } = options;

	const files = await reiverrApi.library
		.getMovieFiles(tmdbId)
		.then((r) => r.data)
		.catch(reportLookupFailure);

	return playFiles(files, options, (userId, playState) =>
		reiverrApi.users.updateMoviePlayState(userId, tmdbId, playState)
	);
}

function reportLookupFailure(e: any): LibraryFileDto[] {
	createErrorNotification('Could not play', e?.response?.data?.message ?? e?.message ?? String(e));
	return [];
}

function playFiles(
	files: LibraryFileDto[],
	options: PlayOptions,
	savePlayState: (userId: string, playState: UpdatePlayStateDto) => Promise<unknown>
): boolean {
	if (!files.length) return false;

	// Media elements cannot send headers, so the token travels in the URL
	const { baseUrl, token } = get(sessions).activeSession ?? { baseUrl: '', token: '' };
	const url = (path: string) => `${baseUrl}/api/library/${path}?reiverr_token=${token}`;

	options.playMedia({
		title: options.title,
		subtitle: options.subtitle,
		// A watched title starts over instead of resuming at its end
		progress: (options.progress ?? 0) >= WATCHED_PROGRESS ? 0 : options.progress,
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
		),
		onProgress: (progress) => {
			const userId = get(user)?.id;
			if (!userId) return;

			savePlayState(userId, {
				progress,
				...(progress > WATCHED_PROGRESS && { watched: true })
			}).finally(() => options.onProgressSaved?.());
		}
	});

	return true;
}
