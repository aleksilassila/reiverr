import createClient from 'openapi-fetch';
import type { components, paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { env } from '$env/dynamic/public';
import { request } from '$lib/utils';
import type { DeviceProfile } from '$lib/apis/jellyfin/playback-profiles';
import { settings } from '$lib/stores/settings.store';
import { get } from 'svelte/store';

export type JellyfinItem = components['schemas']['BaseItemDto'];

export const JELLYFIN_DEVICE_ID = 'Reiverr Client';

export const JellyfinApi = createClient<paths>({
	baseUrl: env.PUBLIC_JELLYFIN_URL,
	headers: {
		Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${env.PUBLIC_JELLYFIN_API_KEY}"`
	}
});

let userId: string | undefined = undefined;
const getUserId = async () => {
	if (userId) return userId;

	const user = JellyfinApi.get('/Users', {
		params: {},
		headers: {
			'cache-control': 'max-age=3600'
		}
	}).then((r) => r.data?.[0]?.Id || '');

	userId = await user;
	return user;
};

export const getJellyfinContinueWatching = async (): Promise<JellyfinItem[]> =>
	JellyfinApi.get('/Users/{userId}/Items/Resume', {
		params: {
			path: {
				userId: await getUserId()
			},
			query: {
				mediaTypes: ['Video'],
				fields: ['ProviderIds']
			}
		}
	}).then((r) => r.data?.Items || []);

export const getJellyfinNextUp = async () =>
	JellyfinApi.get('/Shows/NextUp', {
		params: {
			query: {
				userId: await getUserId(),
				fields: ['ProviderIds']
			}
		}
	}).then((r) => r.data?.Items || []);

export const getJellyfinItems = async () =>
	JellyfinApi.get('/Users/{userId}/Items', {
		params: {
			path: {
				userId: await getUserId()
			},
			query: {
				hasTmdbId: true,
				recursive: true,
				includeItemTypes: ['Movie', 'Series'],
				fields: ['ProviderIds']
			}
		}
	}).then((r) => r.data?.Items || []);

// export const getJellyfinSeries = () =>
// 	JellyfinApi.get('/Users/{userId}/Items', {
// 		params: {
// 			path: {
// 				userId: env.PUBLIC_JELLYFIN_USER_ID || ""
// 			},
// 			query: {
// 				hasTmdbId: true,
// 				recursive: true,
// 				includeItemTypes: ['Series'],
// 			}
// 		}
// 	}).then((r) => r.data?.Items || []);

export const getJellyfinEpisodes = async () =>
	JellyfinApi.get('/Users/{userId}/Items', {
		params: {
			path: {
				userId: await getUserId()
			},
			query: {
				recursive: true,
				includeItemTypes: ['Episode']
			}
		},
		headers: {
			'cache-control': 'max-age=10'
		}
	}).then((r) => r.data?.Items || []);

export const getJellyfinEpisodesBySeries = (seriesId: string) =>
	getJellyfinEpisodes().then((items) => items.filter((i) => i.SeriesId === seriesId) || []);

export const getJellyfinItemByTmdbId = (tmdbId: string) =>
	getJellyfinItems().then((items) => items.find((i) => i.ProviderIds?.Tmdb == tmdbId));

export const getJellyfinItem = async (itemId: string) =>
	JellyfinApi.get('/Users/{userId}/Items/{itemId}', {
		params: {
			path: {
				itemId,
				userId: await getUserId()
			}
		}
	}).then((r) => r.data);

export const requestJellyfinItemByTmdbId = () =>
	request((tmdbId: string) => getJellyfinItemByTmdbId(tmdbId));

export const getJellyfinPlaybackInfo = async (
	itemId: string,
	playbackProfile: DeviceProfile,
	startTimeTicks = 0
) =>
	JellyfinApi.post('/Items/{itemId}/PlaybackInfo', {
		params: {
			path: {
				itemId: itemId
			},
			query: {
				userId: await getUserId(),
				startTimeTicks,
				autoOpenLiveStream: true,
				maxStreamingBitrate: 140000000
			}
		},
		body: {
			DeviceProfile: playbackProfile
		}
	}).then((r) => ({
		playbackUri:
			r.data?.MediaSources?.[0]?.TranscodingUrl ||
			`/Videos/${r.data?.MediaSources?.[0].Id}/stream.mp4?Static=true&mediaSourceId=${r.data?.MediaSources?.[0].Id}&deviceId=${JELLYFIN_DEVICE_ID}&api_key=${PUBLIC_JELLYFIN_API_KEY}&Tag=${r.data?.MediaSources?.[0].ETag}`,
		mediaSourceId: r.data?.MediaSources?.[0]?.Id,
		playSessionId: r.data?.PlaySessionId,
		directPlay:
			!!r.data?.MediaSources?.[0]?.SupportsDirectPlay ||
			!!r.data?.MediaSources?.[0]?.SupportsDirectStream
	}));

export const reportJellyfinPlaybackStarted = (
	itemId: string,
	sessionId: string,
	mediaSourceId: string,
	audioStreamIndex?: number,
	subtitleStreamIndex?: number
) =>
	JellyfinApi.post('/Sessions/Playing', {
		body: {
			CanSeek: true,
			ItemId: itemId,
			PlaySessionId: sessionId,
			MediaSourceId: mediaSourceId,
			AudioStreamIndex: 1,
			SubtitleStreamIndex: -1
		}
	});

export const reportJellyfinPlaybackProgress = (
	itemId: string,
	sessionId: string,
	isPaused: boolean,
	positionTicks: number
) =>
	JellyfinApi.post('/Sessions/Playing/Progress', {
		body: {
			ItemId: itemId,
			PlaySessionId: sessionId,
			IsPaused: isPaused,
			PositionTicks: Math.round(positionTicks),
			CanSeek: true,
			MediaSourceId: itemId
		}
	});

export const reportJellyfinPlaybackStopped = (
	itemId: string,
	sessionId: string,
	positionTicks: number
) =>
	JellyfinApi.post('/Sessions/Playing/Stopped', {
		body: {
			ItemId: itemId,
			PlaySessionId: sessionId,
			PositionTicks: Math.round(positionTicks),
			MediaSourceId: itemId
		}
	});

export const setJellyfinItemWatched = async (jellyfinId: string) =>
	JellyfinApi.post('/Users/{userId}/PlayedItems/{itemId}', {
		params: {
			path: {
				userId: await getUserId(),
				itemId: jellyfinId
			},
			query: {
				datePlayed: new Date().toISOString()
			}
		}
	});

export const setJellyfinItemUnwatched = async (jellyfinId: string) =>
	JellyfinApi.del('/Users/{userId}/PlayedItems/{itemId}', {
		params: {
			path: {
				userId: await getUserId(),
				itemId: jellyfinId
			}
		}
	});
