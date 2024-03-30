import createClient from 'openapi-fetch';
import { get } from 'svelte/store';
import type { components, paths } from './jellyfin.generated';
import type { Api } from '../api.interface';
import { appState } from '../../stores/app-state.store';
import type { DeviceProfile } from './playback-profiles';

export type JellyfinItem = components['schemas']['BaseItemDto'];

export const JELLYFIN_DEVICE_ID = 'Reiverr Client';

export class JellyfinApi implements Api<paths> {
	getClient() {
		const jellyfinSettings = get(appState).user?.settings.jellyfin;
		const baseUrl = jellyfinSettings?.baseUrl;
		const apiKey = jellyfinSettings?.apiKey;

		return createClient<paths>({
			baseUrl,
			headers: {
				Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${apiKey}"`
			}
		});
	}

	getUserId() {
		return get(appState).user?.settings.jellyfin.userId || '';
	}

	getApiKey() {
		return get(appState).user?.settings.jellyfin.apiKey || '';
	}

	async getContinueWatching(): Promise<JellyfinItem[] | undefined> {
		return this.getClient()
			.GET('/Users/{userId}/Items/Resume', {
				params: {
					path: {
						userId: this.getUserId()
					},
					query: {
						mediaTypes: ['Video'],
						fields: ['ProviderIds', 'Genres']
					}
				}
			})
			.then((r) => r.data?.Items || []);
	}

	jellyfinItemsCache: JellyfinItem[] = [];
	async getLibraryItems(refreshCache = false) {
		if (refreshCache || !this.jellyfinItemsCache.length) {
			this.jellyfinItemsCache =
				(await this.getClient()
					.GET('/Users/{userId}/Items', {
						params: {
							path: {
								userId: this.getUserId()
							},
							query: {
								hasTmdbId: true,
								recursive: true,
								includeItemTypes: ['Movie', 'Series'],
								fields: ['ProviderIds', 'Genres', 'DateLastMediaAdded', 'DateCreated']
							}
						}
					})
					.then((r) => r.data?.Items || [])) || Promise.resolve([]);
		}

		return this.jellyfinItemsCache;
	}

	getPosterUrl(item: JellyfinItem, quality = 100, original = false) {
		return item.ImageTags?.Primary
			? `${get(appState).user?.settings.jellyfin.baseUrl}/Items/${
					item?.Id
			  }/Images/Primary?quality=${quality}${original ? '' : '&fillWidth=432'}&tag=${
					item?.ImageTags?.Primary
			  }`
			: '';
	}

	getLibraryItem(itemId: string, refreshCache = false) {
		return this.getLibraryItems(refreshCache).then((items) => items.find((i) => i.Id === itemId));
	}

	getLibraryItemFromTmdbId(tmdbId: string, refreshCache = false) {
		return this.getLibraryItems(refreshCache).then((items) =>
			items.find((i) => i.ProviderIds?.Tmdb === tmdbId)
		);
	}

	// PLAYBACK

	getPlaybackInfo = async (
		itemId: string,
		playbackProfile: DeviceProfile,
		startTimeTicks = 0,
		maxStreamingBitrate = 140000000
	) =>
		this.getClient()
			?.POST('/Items/{itemId}/PlaybackInfo', {
				params: {
					path: {
						itemId: itemId
					},
					query: {
						userId: this.getUserId(),
						startTimeTicks,
						autoOpenLiveStream: true,
						maxStreamingBitrate
					}
				},
				body: {
					DeviceProfile: playbackProfile
				}
			})
			.then((r) => ({
				playbackUri:
					r.data?.MediaSources?.[0]?.TranscodingUrl ||
					`/Videos/${r.data?.MediaSources?.[0]?.Id}/stream.mp4?Static=true&mediaSourceId=${
						r.data?.MediaSources?.[0]?.Id
					}&deviceId=${JELLYFIN_DEVICE_ID}&api_key=${this.getApiKey()}&Tag=${
						r.data?.MediaSources?.[0]?.ETag
					}`,
				mediaSourceId: r.data?.MediaSources?.[0]?.Id,
				playSessionId: r.data?.PlaySessionId,
				directPlay:
					!!r.data?.MediaSources?.[0]?.SupportsDirectPlay ||
					!!r.data?.MediaSources?.[0]?.SupportsDirectStream
			}));

	reportPlaybackStarted(
		itemId: string,
		sessionId: string,
		mediaSourceId: string,
		audioStreamIndex?: number,
		subtitleStreamIndex?: number
	) {
		return this.getClient()?.POST('/Sessions/Playing', {
			body: {
				CanSeek: true,
				ItemId: itemId,
				PlaySessionId: sessionId,
				MediaSourceId: mediaSourceId,
				AudioStreamIndex: 1,
				SubtitleStreamIndex: -1
			}
		});
	}
	reportPlaybackProgress(
		itemId: string,
		sessionId: string,
		isPaused: boolean,
		positionTicks: number
	) {
		return this.getClient()?.POST('/Sessions/Playing/Progress', {
			body: {
				ItemId: itemId,
				PlaySessionId: sessionId,
				IsPaused: isPaused,
				PositionTicks: Math.round(positionTicks),
				CanSeek: true,
				MediaSourceId: itemId
			}
		});
	}

	reportPlaybackStopped(itemId: string, sessionId: string, positionTicks: number) {
		return this.getClient()?.POST('/Sessions/Playing/Stopped', {
			body: {
				ItemId: itemId,
				PlaySessionId: sessionId,
				PositionTicks: Math.round(positionTicks),
				MediaSourceId: itemId
			}
		});
	}
	deleteActiveEncoding(playSessionId: string) {
		return this.getClient()?.DELETE('/Videos/ActiveEncodings', {
			params: {
				query: {
					deviceId: JELLYFIN_DEVICE_ID,
					playSessionId: playSessionId
				}
			}
		});
	}
}

export const jellyfinApi = new JellyfinApi();
export const jellyfinApiClient = jellyfinApi.getClient;

/*
function getJellyfinApi() {
	const baseUrl = get(settings)?.jellyfin.baseUrl;
	const apiKey = get(settings)?.jellyfin.apiKey;
	const userId = get(settings)?.jellyfin.userId;

	if (!baseUrl || !apiKey || !userId) return undefined;

	return createClient<paths>({
		baseUrl,
		headers: {
			Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${apiKey}"`
		}
	});
}

export const getJellyfinContinueWatching = async (): Promise<JellyfinItem[] | undefined> =>
	getJellyfinApi()
		?.GET('/Users/{userId}/Items/Resume', {
			params: {
				path: {
					userId: get(settings)?.jellyfin.userId || ''
				},
				query: {
					mediaTypes: ['Video'],
					fields: ['ProviderIds', 'Genres']
				}
			}
		})
		.then((r) => r.data?.Items || []);

export const getJellyfinNextUp = async () =>
	getJellyfinApi()
		?.GET('/Shows/NextUp', {
			params: {
				query: {
					userId: get(settings)?.jellyfin.userId || '',
					fields: ['ProviderIds', 'Genres']
				}
			}
		})
		.then((r) => r.data?.Items || []);

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

export const getJellyfinEpisodes = async (parentId = '') =>
	getJellyfinApi()
		?.GET('/Users/{userId}/Items', {
			params: {
				path: {
					userId: get(settings)?.jellyfin.userId || ''
				},
				query: {
					recursive: true,
					includeItemTypes: ['Episode'],
					parentId
				}
			},
			headers: {
				'cache-control': 'max-age=10'
			}
		})
		.then((r) => r.data?.Items || []);

export const getJellyfinEpisodesInSeasons = async (seriesId: string) =>
	getJellyfinEpisodes(seriesId).then((items) => {
		const seasons: Record<string, JellyfinItem[]> = {};

		items?.forEach((item) => {
			const seasonNumber = item.ParentIndexNumber || 0;

			if (!seasons[seasonNumber]) {
				seasons[seasonNumber] = [];
			}

			seasons[seasonNumber].push(item);
		});

		return seasons;
	});

// export const getJellyfinEpisodesBySeries = (seriesId: string) =>
// 	getJellyfinEpisodes().then((items) => items?.filter((i) => i.SeriesId === seriesId) || []);

// export const getJellyfinItemByTmdbId = (tmdbId: string) =>
// 	getJellyfinItems().then((items) => items?.find((i) => i.ProviderIds?.Tmdb == tmdbId));

export const getJellyfinItem = async (itemId: string) =>
	getJellyfinApi()
		?.GET('/Users/{userId}/Items/{itemId}', {
			params: {
				path: {
					itemId,
					userId: get(settings)?.jellyfin.userId || ''
				}
			}
		})
		.then((r) => r.data);

// export const requestJellyfinItemByTmdbId = () =>
// 	request((tmdbId: string) => getJellyfinItemByTmdbId(tmdbId));

export const getJellyfinPlaybackInfo = async (
	itemId: string,
	playbackProfile: DeviceProfile,
	startTimeTicks = 0,
	maxStreamingBitrate = 140000000
) =>
	getJellyfinApi()
		?.POST('/Items/{itemId}/PlaybackInfo', {
			params: {
				path: {
					itemId: itemId
				},
				query: {
					userId: get(settings)?.jellyfin.userId || '',
					startTimeTicks,
					autoOpenLiveStream: true,
					maxStreamingBitrate
				}
			},
			body: {
				DeviceProfile: playbackProfile
			}
		})
		.then((r) => ({
			playbackUri:
				r.data?.MediaSources?.[0]?.TranscodingUrl ||
				`/Videos/${r.data?.MediaSources?.[0].Id}/stream.mp4?Static=true&mediaSourceId=${
					r.data?.MediaSources?.[0].Id
				}&deviceId=${JELLYFIN_DEVICE_ID}&api_key=${get(settings)?.jellyfin.apiKey}&Tag=${
					r.data?.MediaSources?.[0].ETag
				}`,
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
	getJellyfinApi()?.POST('/Sessions/Playing', {
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
	getJellyfinApi()?.POST('/Sessions/Playing/Progress', {
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
	getJellyfinApi()?.POST('/Sessions/Playing/Stopped', {
		body: {
			ItemId: itemId,
			PlaySessionId: sessionId,
			PositionTicks: Math.round(positionTicks),
			MediaSourceId: itemId
		}
	});

export const delteActiveEncoding = (playSessionId: string) =>
	getJellyfinApi()?.DELETE('/Videos/ActiveEncodings', {
		params: {
			query: {
				deviceId: JELLYFIN_DEVICE_ID,
				playSessionId: playSessionId
			}
		}
	});

export const setJellyfinItemWatched = async (jellyfinId: string) =>
	getJellyfinApi()?.POST('/Users/{userId}/PlayedItems/{itemId}', {
		params: {
			path: {
				userId: get(settings)?.jellyfin.userId || '',
				itemId: jellyfinId
			},
			query: {
				datePlayed: new Date().toISOString()
			}
		}
	});

export const setJellyfinItemUnwatched = async (jellyfinId: string) =>
	getJellyfinApi()?.DELETE('/Users/{userId}/PlayedItems/{itemId}', {
		params: {
			path: {
				userId: get(settings)?.jellyfin.userId || '',
				itemId: jellyfinId
			}
		}
	});

export const getJellyfinHealth = async (
	baseUrl: string | undefined = undefined,
	apiKey: string | undefined = undefined
) =>
	axios
		.get((baseUrl || get(settings)?.jellyfin.baseUrl) + '/System/Info', {
			headers: {
				'X-Emby-Token': apiKey || get(settings)?.jellyfin.apiKey
			}
		})
		.then((res) => res.status === 200)
		.catch(() => false);

export const getJellyfinUsers = async (
	baseUrl: string | undefined = undefined,
	apiKey: string | undefined = undefined
): Promise<components['schemas']['UserDto'][]> =>
	axios
		.get((baseUrl || get(settings)?.jellyfin.baseUrl) + '/Users', {
			headers: {
				'X-Emby-Token': apiKey || get(settings)?.jellyfin.apiKey
			}
		})
		.then((res) => res.data || [])
		.catch(() => []);

export const getJellyfinBackdrop = (item: JellyfinItem, quality = 100) => {
	if (item.BackdropImageTags?.length) {
		return `${get(settings).jellyfin.baseUrl}/Items/${
			item?.Id
		}/Images/Backdrop?quality=${quality}&tag=${item?.BackdropImageTags?.[0]}`;
	} else {
		return `${get(settings).jellyfin.baseUrl}/Items/${
			item?.Id
		}/Images/Primary?quality=${quality}&tag=${item?.ImageTags?.Primary}`;
	}
};
*/
