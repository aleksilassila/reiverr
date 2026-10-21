import type { PlayMediaOptions } from '$lib/components/GlobalBackground/background-stack.store';
import { createErrorNotification } from '$lib/components/Notifications/notification.store';
import { sessions } from '$lib/stores/session.store';
import { reiverrApi, user } from '$lib/stores/user.store';
import { get } from 'svelte/store';

const WATCHED_PROGRESS = 0.9;

/**
 * Plays an episode from the library, with one video track per file found.
 * Nothing happens when the episode is not on disk, and a failure to look it
 * up is reported.
 *
 * @returns whether playback started
 */
export async function playEpisode(options: {
	tmdbId: string;
	season: number;
	episode: number;
	title: string;
	subtitle: string;
	progress?: number;
	playMedia: (props: PlayMediaOptions) => void;
	/** Called after the play state has been saved */
	onProgressSaved?: () => void;
}): Promise<boolean> {
	const { tmdbId, season, episode } = options;

	const files = await reiverrApi.library
		.getEpisodeFiles(tmdbId, season, episode)
		.then((r) => r.data)
		.catch((e) => {
			createErrorNotification(
				'Could not play',
				e?.response?.data?.message ?? e?.message ?? String(e)
			);
			return [];
		});
	if (!files.length) return false;

	// Media elements cannot send headers, so the token travels in the URL
	const { baseUrl, token } = get(sessions).activeSession ?? { baseUrl: '', token: '' };
	const url = (path: string) => `${baseUrl}/api/library/${path}?reiverr_token=${token}`;

	options.playMedia({
		title: options.title,
		subtitle: options.subtitle,
		// A watched episode starts over instead of resuming at its end
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

			reiverrApi.users
				.updateEpisodePlayState(userId, tmdbId, season, episode, {
					progress,
					...(progress > WATCHED_PROGRESS && { watched: true })
				})
				.finally(() => options.onProgressSaved?.());
		}
	});

	return true;
}
