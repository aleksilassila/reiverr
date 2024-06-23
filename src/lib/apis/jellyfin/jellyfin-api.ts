import createClient from 'openapi-fetch';
import { get } from 'svelte/store';
import type { components, paths } from './jellyfin.generated';
import type { Api } from '../api.interface';
import { user } from '../../stores/user.store';
import type { DeviceProfile } from './playback-profiles';
import axios from 'axios';
import { log } from '../../utils';

export type JellyfinItem = components['schemas']['BaseItemDto'];
export type JellyfinUser = components['schemas']['UserDto'];

type Type = 'movie' | 'series';

export const JELLYFIN_DEVICE_ID = 'Reiverr Client';

export class JellyfinApi implements Api<paths> {
	getClient() {
		const jellyfinSettings = get(user)?.settings.jellyfin;
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
		return get(user)?.settings.jellyfin.userId || '';
	}

	getApiKey() {
		return get(user)?.settings.jellyfin.apiKey || '';
	}

	getBaseUrl() {
		return get(user)?.settings.jellyfin.baseUrl || '';
	}

	getContinueWatching = async (type?: Type): Promise<JellyfinItem[] | undefined> =>
		this.getClient()
			.GET('/Users/{userId}/Items/Resume', {
				params: {
					path: {
						userId: this.getUserId()
					},
					query: {
						mediaTypes: ['Video'],
						fields: ['ProviderIds', 'Genres'],
						...(type ? { parentId: await this.getViewId(type) } : {})
					}
				}
			})
			.then((r) => r.data?.Items || []);

	getContinueWatchingSeries = async () => {
		const seriesIds = [
			...new Set([
				...(await this.getContinueWatching('series')
					.then((items) => items?.map((i) => i.SeriesId) || [])
					.then((ids) => ids.filter((i) => !!i) as string[])),
				...(await this.getJellyfinNextUp()
					.then((items) => items?.map((i) => i.SeriesId) || [])
					.then((ids) => ids.filter((i) => !!i) as string[]))
			])
		];

		return Promise.all(seriesIds.map((id) => this.getLibraryItem(id))).then((is) =>
			is.filter((i): i is JellyfinItem => !!i)
		);
	};

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
								fields: [
									'ProviderIds',
									'Genres',
									'DateLastMediaAdded',
									'DateCreated',
									'MediaSources'
								]
							}
						}
					})
					.then((r) => r.data?.Items || [])) || Promise.resolve([]);
		}

		return this.jellyfinItemsCache;
	}

	getPosterUrl(item: JellyfinItem, quality = 100, original = false) {
		return item.ImageTags?.Primary
			? `${get(user)?.settings.jellyfin.baseUrl}/Items/${
					item?.Id
			  }/Images/Primary?quality=${quality}${original ? '' : '&fillWidth=432'}&tag=${
					item?.ImageTags?.Primary
			  }`
			: '';
	}

	async getLibraryItem(itemId: string, refreshCache = false) {
		const item = await this.getLibraryItems(refreshCache).then((items) =>
			items.find((i) => i.Id === itemId)
		);

		if (item) return item;

		return this.getClient()
			.GET('/Users/{userId}/Items/{itemId}', {
				params: {
					path: {
						itemId,
						userId: this.getUserId()
					}
				}
			})
			.then((r) => r.data);
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
		maxStreamingBitrate = 140000000,
		audioStreamIndex?: number
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
						maxStreamingBitrate,
						...(audioStreamIndex ? { audioStreamIndex } : {}),
						mediaSourceId: itemId
					}
				},
				body: {
					DeviceProfile: playbackProfile
				}
			})
			.then((r) => ({
				...r.data,
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

	getJellyfinContinueWatching = async (): Promise<JellyfinItem[] | undefined> =>
		this.getClient()
			?.GET('/Users/{userId}/Items/Resume', {
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

	getJellyfinNextUp = async () =>
		this.getClient()
			?.GET('/Shows/NextUp', {
				params: {
					query: {
						userId: this.getUserId(),
						fields: ['ProviderIds', 'Genres']
					}
				}
			})
			.then((r) => r.data?.Items || []);

	// getJellyfinSeries = () =>
	// 	JellyfinApi.get('/Users/{userId}/Items', {
	// 		params: {
	// 			path: {
	// 				userId: PUBLIC_JELLYFIN_USER_ID || ''
	// 			},
	// 			query: {
	// 				hasTmdbId: true,
	// 				recursive: true,
	// 				includeItemTypes: ['Series']
	// 			}
	// 		}
	// 	}).then((r) => r.data?.Items || []);

	episodesCache: JellyfinItem[] = [];
	getEpisode = async (
		seriesId: string,
		season: number,
		episode: number,
		refreshCache = false
	): Promise<JellyfinItem | undefined> =>
		this.getClient()
			.GET('/Users/{userId}/Items', {
				params: {
					path: {
						userId: this.getUserId()
					},
					query: {
						// @ts-ignore
						seriesId,
						parentIndexNumber: season,
						indexNumber: episode,
						recursive: true,
						includeItemTypes: ['Episode'],
						fields: ['ProviderIds', 'Genres', 'DateLastMediaAdded', 'DateCreated', 'MediaSources']
					}
				}
			})
			.then((r) =>
				r.data?.Items?.find(
					(i) =>
						i?.ParentIndexNumber === season &&
						i?.IndexNumber === episode &&
						i?.SeriesId === seriesId
				)
			);

	getJellyfinEpisodes = async (parentId = '') =>
		this.getClient()
			?.GET('/Users/{userId}/Items', {
				params: {
					path: {
						userId: this.getUserId()
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
			.then((r) => r.data?.Items || []) || [];

	getJellyfinEpisodesInSeasons = async (seriesId: string) =>
		this.getJellyfinEpisodes(seriesId).then((items) => {
			const seasons: Record<string, JellyfinItem[]> = {};

			items?.forEach((item) => {
				const seasonNumber = item.ParentIndexNumber || 0;

				if (!seasons[seasonNumber]) {
					seasons[seasonNumber] = [];
				}

				seasons[seasonNumber]?.push(item);
			});

			return seasons;
		});

	//  getJellyfinEpisodesBySeries = (seriesId: string) =>
	// 	getJellyfinEpisodes().then((items) => items?.filter((i) => i.SeriesId === seriesId) || []);

	//  getJellyfinItemByTmdbId = (tmdbId: string) =>
	// 	getJellyfinItems().then((items) => items?.find((i) => i.ProviderIds?.Tmdb == tmdbId));

	getJellyfinItem = async (itemId: string) =>
		this.getClient()
			?.GET('/Users/{userId}/Items/{itemId}', {
				params: {
					path: {
						itemId,
						userId: this.getUserId()
					}
				}
			})
			.then((r) => r.data);

	//  requestJellyfinItemByTmdbId = () =>
	// 	request((tmdbId: string) => getJellyfinItemByTmdbId(tmdbId));

	getJellyfinPlaybackInfo = async (
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

	reportJellyfinPlaybackStarted = (
		itemId: string,
		sessionId: string,
		mediaSourceId: string,
		audioStreamIndex?: number,
		subtitleStreamIndex?: number
	) =>
		this.getClient()?.POST('/Sessions/Playing', {
			body: {
				CanSeek: true,
				ItemId: itemId,
				PlaySessionId: sessionId,
				MediaSourceId: mediaSourceId,
				AudioStreamIndex: 1,
				SubtitleStreamIndex: -1
			}
		});

	reportJellyfinPlaybackProgress = (
		itemId: string,
		sessionId: string,
		isPaused: boolean,
		positionTicks: number
	) =>
		this.getClient()?.POST('/Sessions/Playing/Progress', {
			body: {
				ItemId: itemId,
				PlaySessionId: sessionId,
				IsPaused: isPaused,
				PositionTicks: Math.round(positionTicks),
				CanSeek: true,
				MediaSourceId: itemId
			}
		});

	reportJellyfinPlaybackStopped = (itemId: string, sessionId: string, positionTicks: number) =>
		this.getClient()?.POST('/Sessions/Playing/Stopped', {
			body: {
				ItemId: itemId,
				PlaySessionId: sessionId,
				PositionTicks: Math.round(positionTicks),
				MediaSourceId: itemId
			}
		});

	delteActiveEncoding = (playSessionId: string) =>
		this.getClient()?.DELETE('/Videos/ActiveEncodings', {
			params: {
				query: {
					deviceId: JELLYFIN_DEVICE_ID,
					playSessionId: playSessionId
				}
			}
		});

	markAsWatched = async (jellyfinId: string) =>
		this.getClient()
			?.POST('/Users/{userId}/PlayedItems/{itemId}', {
				params: {
					path: {
						userId: this.getUserId(),
						itemId: jellyfinId
					},
					query: {
						datePlayed: new Date().toISOString()
					}
				}
			})

			.then((res) => res.response.status === 200);

	markAsUnwatched = async (jellyfinId: string) =>
		this.getClient()
			?.DELETE('/Users/{userId}/PlayedItems/{itemId}', {
				params: {
					path: {
						userId: this.getUserId(),
						itemId: jellyfinId
					}
				}
			})
			.then((res) => res.response.status === 200);

	getJellyfinHealth = async (
		baseUrl: string | undefined = undefined,
		apiKey: string | undefined = undefined
	) =>
		axios
			.get((baseUrl || this.getBaseUrl()) + '/System/Info', {
				headers: {
					'X-Emby-Token': apiKey || this.getApiKey()
				}
			})
			.then((res) => res.status === 200)
			.catch(() => false);

	getJellyfinUsers = async (
		baseUrl: string | undefined = undefined,
		apiKey: string | undefined = undefined
	): Promise<JellyfinUser[]> =>
		axios
			.get((baseUrl ?? this.getBaseUrl()) + '/Users', {
				headers: {
					'X-Emby-Token': apiKey ?? this.getApiKey()
				}
			})
			.then((res) => res.data || [])
			.catch(() => []);

	getBackdrop = (item: JellyfinItem, quality = 100) => {
		if (item.BackdropImageTags?.length) {
			return `${this.getBaseUrl()}/Items/${item?.Id}/Images/Backdrop?quality=${quality}&tag=${
				item?.BackdropImageTags?.[0]
			}`;
		} else {
			return `${this.getBaseUrl()}/Items/${item?.Id}/Images/Primary?quality=${quality}&tag=${
				item?.ImageTags?.Primary
			}`;
		}
	};

	private views: Record<string, JellyfinItem | undefined> = {
		movie: undefined,
		series: undefined
	};
	getViewId = async (type?: Type) => {
		if (!type) return undefined;

		if (!this.views[type]) {
			await this.getClient()
				.GET('/Users/{userId}/Views', {
					params: {
						path: {
							userId: this.getUserId()
						}
					}
				})
				.then((r) => {
					for (const view of r.data?.Items || []) {
						const key = { Movies: 'movie', Shows: 'series' }[view.Name || ''];
						this.views[key || view.Name || ''] = view;
					}
				});
		}

		return this.views[type]?.Id;
	};

	getRecentlyAdded = (type?: Type) =>
		this.getViewId(type).then((parentId) =>
			this.getClient()
				.GET('/Users/{userId}/Items/Latest', {
					params: {
						path: {
							userId: this.getUserId()
						},
						query: {
							...(parentId ? { parentId } : {}),
							fields: ['ProviderIds']
						}
					}
				})
				.then((r) => r.data || [])
		);
	// this.getLibraryItems().then((items) => {
	// 	return items
	// 		.sort((a, b) => {
	// 			const aDate = new Date(a.DateCreated || a.DateLastMediaAdded || '');
	// 			const bDate = new Date(b.DateCreated || b.DateLastMediaAdded || '');
	//
	// 			return bDate.getTime() - aDate.getTime();
	// 		})
	// 		.filter((item) => {
	// 			if (type === 'movie') return item.Type === 'Movie';
	// 			if (type === 'series') return item.Type === 'Series';
	// 			return true;
	// 		});
	// });
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
