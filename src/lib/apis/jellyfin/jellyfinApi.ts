import type { components, paths } from '$lib/apis/jellyfin/jellyfin.generated';
import type { DeviceProfile } from '$lib/apis/jellyfin/playback-profiles';
import { JELLYFIN_API_KEY, JELLYFIN_BASE_URL } from '$lib/constants';
import createClient from 'openapi-fetch';

export type JellyfinItem = components['schemas']['BaseItemDto'];

export const jellyfinAvailable = !!JELLYFIN_BASE_URL && !!JELLYFIN_API_KEY;

export const JELLYFIN_DEVICE_ID = 'Reiverr Client';

export const JellyfinApi =
	JELLYFIN_BASE_URL && JELLYFIN_API_KEY
		? createClient<paths>({
				baseUrl: JELLYFIN_BASE_URL,
				headers: {
					Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${JELLYFIN_API_KEY}"`
				}
		  })
		: undefined;

let userId: string | undefined = undefined;
const getUserId = async () => {
	if (userId) return userId;

	const user = JellyfinApi?.get('/Users', {
		params: {},
		headers: {
			'cache-control': 'max-age=3600'
		}
	}).then((r) => r.data?.[0]?.Id || '');

	userId = await user;
	return user;
};

export const getJellyfinContinueWatching = async (): Promise<JellyfinItem[] | undefined> =>
	getUserId().then((userId) =>
		userId
			? JellyfinApi?.get('/Users/{userId}/Items/Resume', {
					params: {
						path: {
							userId
						},
						query: {
							mediaTypes: ['Video'],
							fields: ['ProviderIds']
						}
					}
			  }).then((r) => r.data?.Items || [])
			: undefined
	);

export const getJellyfinNextUp = async () =>
	getUserId().then((userId) =>
		userId
			? JellyfinApi?.get('/Shows/NextUp', {
					params: {
						query: {
							userId,
							fields: ['ProviderIds']
						}
					}
			  }).then((r) => r.data?.Items || [])
			: undefined
	);

export const getJellyfinItems = async () =>
	getUserId().then((userId) =>
		userId
			? JellyfinApi?.get('/Users/{userId}/Items', {
					params: {
						path: {
							userId
						},
						query: {
							hasTmdbId: true,
							recursive: true,
							includeItemTypes: ['Movie', 'Series'],
							fields: ['ProviderIds']
						}
					}
			  }).then((r) => r.data?.Items || [])
			: undefined
	);

// export const getJellyfinSeries = () =>
// 	JellyfinApi.get('/Users/{userId}/Items', {
// 		params: {
// 			path: {
// 				userId: PUBLIC_JELLYFIN_USER_ID || ""
// 			},
// 			query: {
// 				hasTmdbId: true,
// 				recursive: true,
// 				includeItemTypes: ['Series'],
// 			}
// 		}
// 	}).then((r) => r.data?.Items || []);

export const getJellyfinEpisodes = async () =>
	getUserId().then((userId) =>
		userId
			? JellyfinApi?.get('/Users/{userId}/Items', {
					params: {
						path: {
							userId
						},
						query: {
							recursive: true,
							includeItemTypes: ['Episode']
						}
					},
					headers: {
						'cache-control': 'max-age=10'
					}
			  }).then((r) => r.data?.Items || [])
			: undefined
	);

// export const getJellyfinEpisodesBySeries = (seriesId: string) =>
// 	getJellyfinEpisodes().then((items) => items?.filter((i) => i.SeriesId === seriesId) || []);

// export const getJellyfinItemByTmdbId = (tmdbId: string) =>
// 	getJellyfinItems().then((items) => items?.find((i) => i.ProviderIds?.Tmdb == tmdbId));

export const getJellyfinItem = async (itemId: string) =>
	getUserId().then((userId) =>
		userId
			? JellyfinApi?.get('/Users/{userId}/Items/{itemId}', {
					params: {
						path: {
							itemId,
							userId
						}
					}
			  }).then((r) => r.data)
			: undefined
	);

// export const requestJellyfinItemByTmdbId = () =>
// 	request((tmdbId: string) => getJellyfinItemByTmdbId(tmdbId));

export const getJellyfinPlaybackInfo = async (
	itemId: string,
	playbackProfile: DeviceProfile,
	startTimeTicks = 0
) =>
	getUserId().then((userId) =>
		userId
			? JellyfinApi?.post('/Items/{itemId}/PlaybackInfo', {
					params: {
						path: {
							itemId: itemId
						},
						query: {
							userId,
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
						`/Videos/${r.data?.MediaSources?.[0].Id}/stream.mp4?Static=true&mediaSourceId=${r.data?.MediaSources?.[0].Id}&deviceId=${JELLYFIN_DEVICE_ID}&api_key=${JELLYFIN_API_KEY}&Tag=${r.data?.MediaSources?.[0].ETag}`,
					mediaSourceId: r.data?.MediaSources?.[0]?.Id,
					playSessionId: r.data?.PlaySessionId,
					directPlay:
						!!r.data?.MediaSources?.[0]?.SupportsDirectPlay ||
						!!r.data?.MediaSources?.[0]?.SupportsDirectStream
			  }))
			: undefined
	);

export const reportJellyfinPlaybackStarted = (
	itemId: string,
	sessionId: string,
	mediaSourceId: string,
	audioStreamIndex?: number,
	subtitleStreamIndex?: number
) =>
	getUserId().then((userId) =>
		userId
			? JellyfinApi?.post('/Sessions/Playing', {
					body: {
						CanSeek: true,
						ItemId: itemId,
						PlaySessionId: sessionId,
						MediaSourceId: mediaSourceId,
						AudioStreamIndex: 1,
						SubtitleStreamIndex: -1
					}
			  })
			: undefined
	);

export const reportJellyfinPlaybackProgress = (
	itemId: string,
	sessionId: string,
	isPaused: boolean,
	positionTicks: number
) =>
	JellyfinApi?.post('/Sessions/Playing/Progress', {
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
	JellyfinApi?.post('/Sessions/Playing/Stopped', {
		body: {
			ItemId: itemId,
			PlaySessionId: sessionId,
			PositionTicks: Math.round(positionTicks),
			MediaSourceId: itemId
		}
	});

export const setJellyfinItemWatched = async (jellyfinId: string) =>
	getUserId().then((userId) =>
		userId
			? JellyfinApi?.post('/Users/{userId}/PlayedItems/{itemId}', {
					params: {
						path: {
							userId,
							itemId: jellyfinId
						},
						query: {
							datePlayed: new Date().toISOString()
						}
					}
			  })
			: undefined
	);

export const setJellyfinItemUnwatched = async (jellyfinId: string) =>
	getUserId().then((userId) =>
		userId
			? JellyfinApi?.del('/Users/{userId}/PlayedItems/{itemId}', {
					params: {
						path: {
							userId,
							itemId: jellyfinId
						}
					}
			  })
			: undefined
	);
