import createClient from 'openapi-fetch';
import { get } from 'svelte/store';
import type { operations, paths } from './tmdb.generated';
import type { operations as operations4, paths as paths4 } from './tmdb4.generated';
import { TMDB_API_KEY, TMDB_BACKDROP_SMALL } from '../../constants';
import { settings } from '../../stores/settings.store';
import type { TitleType } from '../../types';
import type { Api } from '../api.interface';
import { user } from '../../stores/user.store';
import { sessions } from '../../stores/session.store';

const CACHE_ONE_DAY = 'max-age=86400';
const CACHE_FOUR_DAYS = 'max-age=345600';

export type TmdbMovie2 =
	operations['movie-details']['responses']['200']['content']['application/json'];
export type TmdbMovieSmall = NonNullable<
	operations['discover-movie']['responses']['200']['content']['application/json']['results']
>[0];
export type TmdbSeries2 =
	operations['tv-series-details']['responses']['200']['content']['application/json'];
export type TmdbSeriesSmall = NonNullable<
	operations['discover-tv']['responses']['200']['content']['application/json']['results']
>[0];
export type TmdbSeason =
	operations['tv-season-details']['responses']['200']['content']['application/json'];
export type TmdbSeasonEpisode = NonNullable<TmdbSeason['episodes']>[0];
export type TmdbPerson =
	operations['person-details']['responses']['200']['content']['application/json'];
export type TmdbCredit =
	| NonNullable<TmdbSeriesFull2['aggregate_credits']['cast']>[0]
	| NonNullable<TmdbMovieFull2['credits']['cast']>[0];
export type TmdbEpisode =
	operations['tv-episode-details']['responses']['200']['content']['application/json'];

export interface TmdbPersonFull extends TmdbPerson {
	images: operations['person-images']['responses']['200']['content']['application/json'];
	movie_credits: operations['person-tv-credits']['responses']['200']['content']['application/json'];
	tv_credits: operations['person-movie-credits']['responses']['200']['content']['application/json'];
	external_ids: operations['person-external-ids']['responses']['200']['content']['application/json'];
}

export interface TmdbMovieFull2 extends TmdbMovie2 {
	videos: operations['movie-videos']['responses']['200']['content']['application/json'];
	credits: operations['movie-credits']['responses']['200']['content']['application/json'];
	external_ids: operations['movie-external-ids']['responses']['200']['content']['application/json'];
	images: operations['movie-images']['responses']['200']['content']['application/json'];
}

export interface TmdbSeriesFull2 extends TmdbSeries2 {
	videos: operations['tv-series-videos']['responses']['200']['content']['application/json'];
	aggregate_credits: operations['tv-series-aggregate-credits']['responses']['200']['content']['application/json'];
	external_ids: operations['tv-series-external-ids']['responses']['200']['content']['application/json'];
	images: operations['tv-series-images']['responses']['200']['content']['application/json'];
}

export class TmdbApi implements Api<paths> {
	static getClient() {
		const session = get(sessions).activeSession;
		const token = session?.token;

		return createClient<paths>({
			baseUrl: `${session?.baseUrl}/api/tmdb/v3/proxy`,
			headers: {
				Authorization: `Bearer ${token}`
				// Authorization: `Bearer ${TMDB_API_KEY}`
			}
		});
	}

	static getClient4() {
		return createClient<paths4>({
			baseUrl: 'https://api.themoviedb.org',
			headers: {
				Authorization: `Bearer ${TMDB_API_KEY}`
			}
		});
	}

	static getClient4l() {
		const sessionId = get(user)?.settings.tmdb.sessionId;

		return createClient<paths4>({
			baseUrl: 'https://api.themoviedb.org',
			headers: {
				Authorization: `Bearer ${sessionId}`
			}
		});
	}

	getClient() {
		return TmdbApi.getClient();
	}

	getClient4() {
		return TmdbApi.getClient4();
	}

	getClient4l() {
		return TmdbApi.getClient4l();
	}

	getSessionId() {
		return get(user)?.settings.tmdb.sessionId;
	}

	getUserId() {
		return get(user)?.settings.tmdb.userId;
	}

	// MOVIES

	getTmdbMovie = async (tmdbId: number) => {
		return this.getClient()
			?.GET('/3/movie/{movie_id}', {
				params: {
					path: {
						movie_id: tmdbId
					},
					query: {
						append_to_response: 'videos,credits,external_ids,images',
						...({ include_image_language: get(settings)?.language + ',en,null' } as any)
					}
				}
			})
			.then((res) => res.data as TmdbMovieFull2 | undefined);
	};

	getPopularMovies = () =>
		this.getClient()
			?.GET('/3/movie/popular', {
				params: {
					query: {
						language: get(settings)?.language,
						region: get(settings)?.discover.region
					}
				}
			})
			.then((res) => res.data?.results || []);

	// SERIES

	getTmdbSeriesFromTvdbId = async (tvdbId: string) =>
		this.getClient()
			?.GET('/3/find/{external_id}', {
				params: {
					path: {
						external_id: tvdbId
					},
					query: {
						external_source: 'tvdb_id'
					}
				},
				headers: {
					'Cache-Control': CACHE_ONE_DAY
				}
			})
			.then((res) => res.data?.tv_results?.[0] as TmdbSeries2 | undefined);

	getTmdbIdFromTvdbId = async (tvdbId: number) =>
		getTmdbSeriesFromTvdbId(String(tvdbId)).then((res: any) => {
			const id = res?.id as number | undefined;
			if (!id) return Promise.reject();
			return id;
		});

	getTmdbSeries = async (tmdbId: number): Promise<TmdbSeriesFull2 | undefined> =>
		await this.getClient()
			?.GET('/3/tv/{series_id}', {
				params: {
					path: {
						series_id: tmdbId
					},
					query: {
						append_to_response: 'videos,aggregate_credits,external_ids,images',
						...({ include_image_language: get(settings)?.language + ',en,null' } as any)
					}
				},
				headers: {
					'Cache-Control': CACHE_ONE_DAY
				}
			})
			.then((res) => res.data as TmdbSeriesFull2 | undefined);

	getTmdbSeriesSeason = async (tmdbId: number, season: number): Promise<TmdbSeason | undefined> =>
		this.getClient()
			?.GET('/3/tv/{series_id}/season/{season_number}', {
				params: {
					path: {
						series_id: tmdbId,
						season_number: season
					}
				}
			})
			.then((res) => res.data);

	getTmdbSeriesSeasons = async (tmdbId: number, seasons: number) =>
		Promise.all([...Array(seasons).keys()].map((i) => getTmdbSeriesSeason(tmdbId, i + 1))).then(
			(r) => r.filter((s) => s) as TmdbSeason[]
		);

	getTmdbSeriesImages = async (tmdbId: number) =>
		this.getClient()
			?.GET('/3/tv/{series_id}/images', {
				params: {
					path: {
						series_id: tmdbId
					}
				},
				headers: {
					'Cache-Control': CACHE_FOUR_DAYS // 4 days
				}
			})
			.then((res) => res.data);

	getPopularSeries = () =>
		this.getClient()
			.GET('/3/tv/popular', {
				params: {
					query: {
						language: get(settings)?.language
					}
				}
			})
			.then((res) => res.data?.results || []);

	getSeriesRecommendations = (tmdbId: number) =>
		this.getClient()
			.GET('/3/tv/{series_id}/recommendations', {
				params: {
					path: {
						series_id: tmdbId
					}
				}
			})
			.then((res) => res.data?.results || []);

	getMovieRecommendations = (tmdbId: number) =>
		this.getClient()
			.GET('/3/movie/{movie_id}/recommendations', {
				params: {
					path: {
						movie_id: tmdbId
					}
				}
			})
			.then((res) => res.data?.results || []);

	getEpisode = (
		seriesId: number,
		season: number,
		episode: number
	): Promise<TmdbEpisode | undefined> =>
		this.getClient()
			.GET('/3/tv/{series_id}/season/{season_number}/episode/{episode_number}', {
				params: {
					path: {
						series_id: seriesId,
						season_number: season,
						episode_number: episode
					},
					query: {
						append_to_response: 'credits,external_ids,images'
					}
				}
			})
			.then((res) => res.data);

	searchTitles = (query: string) =>
		this.getClient()
			?.GET('/3/search/multi', {
				params: {
					query: {
						query
					}
				}
			})
			.then((res) => res.data?.results || []) || Promise.resolve([]);

	getPerson = async (person_id: number) =>
		this.getClient()
			.GET('/3/person/{person_id}', {
				params: {
					path: {
						person_id: person_id
					},
					query: {
						append_to_response: 'images,movie_credits,tv_credits,external_ids'
					}
				}
			})
			.then((res) => res.data as TmdbPersonFull);

	getPersonTaggedImages = async (person_id: number) =>
		this.getClient()
			?.GET('/3/person/{person_id}/tagged_images', {
				params: {
					path: {
						person_id: person_id
					}
				}
			})
			.then((res) => res.data?.results || []) || Promise.resolve([]);

	getPersonBackdrops = async (person_id: number) =>
		this.getPersonTaggedImages(person_id).then((r) => r.filter((i) => (i.aspect_ratio || 0) > 1.5));

	getMovieVideos = async (tmdbId: number) => {
		return this.getClient()
			.GET('/3/movie/{movie_id}/videos', {
				params: {
					path: {
						movie_id: tmdbId
					},
					query: {
						language: get(settings)?.language || 'en'
					}
				}
			})
			.then((res) => res.data?.results || []);
	};
	getSeriesVideos = async (tmdbId: number) => {
		return this.getClient()
			?.GET('/3/tv/{series_id}/videos', {
				params: {
					path: {
						series_id: tmdbId
					},
					query: {
						language: get(settings)?.language || 'en'
					}
				}
			})
			.then((res) => res.data?.results || []);
	};

	// OTHER

	// USER

	getRecommendedMovies = async (): Promise<{
		top10: TmdbMovieSmall[];
		top20: TmdbMovieSmall[];
		genreIdToMovie: Record<number, TmdbMovieSmall[]>;
		action: TmdbMovieSmall[];
		adventure: TmdbMovieSmall[];
		drama: TmdbMovieSmall[];
		comedy: TmdbMovieSmall[];
		topRated: TmdbMovieSmall[];
		mostPopular: TmdbMovieSmall[];
	}> => {
		const userId = this.getUserId();
		if (!userId)
			return {
				top10: [],
				top20: [],
				genreIdToMovie: {},
				action: [],
				adventure: [],
				drama: [],
				comedy: [],
				topRated: [],
				mostPopular: []
			};

		const top100: TmdbMovieSmall[] = await Promise.all(
			[...Array(5).keys()].map((i) =>
				this.getClient4l()
					?.GET('/4/account/{account_object_id}/movie/recommendations', {
						params: {
							path: {
								account_object_id: userId
							},
							query: {
								page: i + 1
							}
						}
					})
					.then((res: any) => res.data?.results || [])
			)
		).then((r) => r.flat());

		const top10 = top100.slice(0, 10);
		const top20 = top100.slice(0, 20);

		const genreIdToMovie: Record<number, TmdbMovieSmall[]> = {};

		top100.forEach((m) => {
			m.genre_ids?.forEach((genreId) => {
				if (!genreIdToMovie[genreId]) genreIdToMovie[genreId] = [];
				if (top10.includes(m)) return;
				const l = genreIdToMovie[genreId]?.length || 0;
				genreIdToMovie[genreId]?.splice(Math.floor(Math.random() * (l + 1)), 0, m);
			});
		});

		const topRated = top100
			.slice()
			.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
			.filter((m) => !top20.includes(m));

		const mostPopular = top100
			.slice()
			.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
			.filter((m) => !top20.includes(m));

		return {
			top10,
			top20,
			genreIdToMovie,
			action: (genreIdToMovie[28] || []).filter((m) => !top10.includes(m)),
			adventure: (genreIdToMovie[12] || []).filter((m) => !top10.includes(m)),
			drama: (genreIdToMovie[18] || []).filter((m) => !top10.includes(m)),
			comedy: (genreIdToMovie[35] || []).filter((m) => !top10.includes(m)),
			topRated,
			mostPopular
		};
	};

	getRecommendedSeries = async (): Promise<{
		top10: TmdbSeriesSmall[];
		top20: TmdbSeriesSmall[];
		genreIdToMovie: Record<string, TmdbSeriesSmall[]>;
		topGenres: string[];
		topRated: TmdbSeriesSmall[];
		mostPopular: TmdbSeriesSmall[];
	}> => {
		const userId = this.getUserId();

		if (!userId)
			return {
				top10: [],
				top20: [],
				genreIdToMovie: {},
				topGenres: [],
				topRated: [],
				mostPopular: []
			};

		const top100: TmdbSeriesSmall[] = await Promise.all(
			[...Array(5).keys()].map((i) =>
				this.getClient4l()
					?.GET('/4/account/{account_object_id}/tv/recommendations', {
						params: {
							path: {
								account_object_id: userId
							},
							query: {
								page: i + 1
							}
						}
					})
					.then((res: any) => res.data?.results || [])
			)
		).then((r) => r.flat());

		const top10 = top100.slice(0, 10);
		const top20 = top100.slice(0, 20);

		const genreIdToMovie: Record<string, TmdbMovieSmall[]> = {};

		top100.forEach((m) => {
			m.genre_ids?.forEach((genreId) => {
				if (!genreIdToMovie[genreId]) genreIdToMovie[genreId] = [];
				if (top10.includes(m)) return;
				const l = genreIdToMovie[genreId]?.length || 0;
				genreIdToMovie[genreId]?.splice(Math.floor(Math.random() * (l + 1)), 0, m);
			});
		});

		const topGenres = Object.keys(genreIdToMovie).sort(
			(a, b) => (genreIdToMovie[b]?.length || 0) - (genreIdToMovie[a]?.length || 0)
		);

		const topRated = top100
			.slice()
			.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
			.filter((m) => !top10.includes(m));

		const mostPopular = top100
			.slice()
			.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
			.filter((m) => !top10.includes(m));

		return {
			top10,
			top20,
			genreIdToMovie,
			topGenres,
			topRated,
			mostPopular
		};
	};

	getConnectAccountLink = () =>
		this.getClient4()
			?.POST('/4/auth/request_token', {})
			.then((res) => res.data);

	getAccountAccessToken = (requestToken: string) =>
		this.getClient4()
			?.POST('/4/auth/access_token', {
				body: {
					// @ts-ignore
					request_token: requestToken
				}
			})
			.then((res) => res.data);

	getAccountDetails = () => {
		const userId = this.getUserId();
		if (!userId) return undefined;

		return (
			this.getClient4l()
				// @ts-ignore
				?.GET('/4/account/{account_object_id}', {
					params: {
						path: {
							account_object_id: userId
						}
					}
				})
				.then((res) => res.data)
		);
	};
}

export const tmdbApi = new TmdbApi();
export const getTmdbClient = tmdbApi.getClient;

const backdropCache = window?.caches?.open('backdrops') || undefined;
const posterCache = window?.caches?.open('posters') || undefined;

const getTmdbCache = async (
	cachePromise: typeof backdropCache,
	tmdbId: number,
	fn: () => Promise<string | undefined>
) => {
	const cache = await cachePromise;

	if (cache) {
		const cacheRes = await cache.match(String(tmdbId));
		if (cacheRes) return cacheRes.text();
		else {
			const backdropUri = await fn();
			if (backdropUri) {
				await cache.put(String(tmdbId), new Response(backdropUri));
			}
			return backdropUri;
		}
	} else {
		return fn();
	}
};

export const TmdbApiOpen = createClient<paths>({
	baseUrl: 'https://api.themoviedb.org',
	headers: {
		Authorization: `Bearer ${TMDB_API_KEY}`
	}
});

export const getTmdbMovie = async (tmdbId: number) =>
	await TmdbApiOpen.GET('/3/movie/{movie_id}', {
		params: {
			path: {
				movie_id: tmdbId
			},
			query: {
				append_to_response: 'videos,credits,external_ids,images',
				...({ include_image_language: get(settings)?.language + ',en,null' } as any)
			}
		}
	}).then((res) => res.data as TmdbMovieFull2 | undefined);

export const getTmdbSeriesFromTvdbId = async (tvdbId: string) =>
	TmdbApiOpen.GET('/3/find/{external_id}', {
		params: {
			path: {
				external_id: tvdbId
			},
			query: {
				external_source: 'tvdb_id'
			}
		},
		headers: {
			'Cache-Control': CACHE_ONE_DAY
		}
	}).then((res) => res.data?.tv_results?.[0] as TmdbSeries2 | undefined);

export const getTmdbIdFromTvdbId = async (tvdbId: number) =>
	getTmdbSeriesFromTvdbId(String(tvdbId)).then((res: any) => {
		const id = res?.id as number | undefined;
		if (!id) return Promise.reject();
		return id;
	});

export const getTmdbSeries = async (tmdbId: number): Promise<TmdbSeriesFull2 | undefined> =>
	await TmdbApiOpen.GET('/3/tv/{series_id}', {
		params: {
			path: {
				series_id: tmdbId
			},
			query: {
				append_to_response: 'videos,aggregate_credits,external_ids,images',
				...({ include_image_language: get(settings)?.language + ',en,null' } as any)
			}
		},
		headers: {
			'Cache-Control': CACHE_ONE_DAY
		}
	}).then((res) => res.data as TmdbSeriesFull2 | undefined);

export const getTmdbSeriesSeason = async (
	tmdbId: number,
	season: number
): Promise<TmdbSeason | undefined> =>
	TmdbApiOpen.GET('/3/tv/{series_id}/season/{season_number}', {
		params: {
			path: {
				series_id: tmdbId,
				season_number: season
			}
		}
	}).then((res) => res.data);

export const getTmdbSeriesSeasons = async (tmdbId: number, seasons: number) =>
	Promise.all([...Array(seasons).keys()].map((i) => getTmdbSeriesSeason(tmdbId, i + 1))).then(
		(r) => r.filter((s) => s) as TmdbSeason[]
	);

export const getTmdbSeriesImages = async (tmdbId: number) =>
	TmdbApiOpen.GET('/3/tv/{series_id}/images', {
		params: {
			path: {
				series_id: tmdbId
			}
		},
		headers: {
			'Cache-Control': CACHE_FOUR_DAYS // 4 days
		}
	}).then((res) => res.data);

export const getTmdbMovieImages = async (tmdbId: number) =>
	await TmdbApiOpen.GET('/3/movie/{movie_id}/images', {
		params: {
			path: {
				movie_id: tmdbId
			}
		},
		headers: {
			'Cache-Control': CACHE_FOUR_DAYS // 4 days
		}
	}).then((res) => res.data);

export const getTmdbSeriesBackdrop = async (tmdbId: number) =>
	getTmdbCache(backdropCache, tmdbId, () =>
		getTmdbSeries(tmdbId)
			.then((s) => s?.images)
			.then(
				(r) =>
					(
						r?.backdrops?.find((b) => b.iso_639_1 === get(settings)?.language) ||
						r?.backdrops?.find((b) => b.iso_639_1 === 'en') ||
						r?.backdrops?.find((b) => b.iso_639_1) ||
						r?.backdrops?.[0]
					)?.file_path
			)
	);

export const getTmdbMovieBackdrop = async (tmdbId: number) =>
	getTmdbCache(backdropCache, tmdbId, () =>
		getTmdbMovie(tmdbId)
			.then((m) => m?.images)
			.then(
				(r) =>
					(
						r?.backdrops?.find((b) => b.iso_639_1 === get(settings)?.language) ||
						r?.backdrops?.find((b) => b.iso_639_1 === 'en') ||
						r?.backdrops?.find((b) => b.iso_639_1) ||
						r?.backdrops?.[0]
					)?.file_path
			)
	);

export const getTmdbSeriesPoster = async (tmdbId: number) =>
	getTmdbCache(posterCache, tmdbId, () => getTmdbSeries(tmdbId).then((s) => s?.poster_path));

export const getTmdbMoviePoster = async (tmdbId: number) =>
	getTmdbCache(posterCache, tmdbId, () => getTmdbMovie(tmdbId).then((m) => m?.poster_path));

/** Discover */

export const getTmdbNetworkSeries = (networkId: number) =>
	TmdbApiOpen.GET('/3/discover/tv', {
		params: {
			query: {
				with_networks: networkId
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbGenreMovies = (genreId: number) =>
	TmdbApiOpen.GET('/3/discover/movie', {
		params: {
			query: {
				with_genres: String(genreId)
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbSeriesRecommendations = (tmdbId: number) =>
	TmdbApiOpen.GET('/3/tv/{series_id}/recommendations', {
		params: {
			path: {
				series_id: tmdbId
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbSeriesSimilar = (tmdbId: number) =>
	TmdbApiOpen.GET('/3/tv/{series_id}/similar', {
		params: {
			path: {
				series_id: String(tmdbId)
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbSeriesCredits = (tmdbId: number) =>
	TmdbApiOpen.GET('/3/tv/{series_id}/credits', {
		params: {
			path: {
				series_id: tmdbId
			}
		}
	}).then((res) => res.data?.cast || []);

export const getTmdbMovieRecommendations = (tmdbId: number) =>
	TmdbApiOpen.GET('/3/movie/{movie_id}/recommendations', {
		params: {
			path: {
				movie_id: tmdbId
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbMovieSimilar = (tmdbId: number) =>
	TmdbApiOpen.GET('/3/movie/{movie_id}/similar', {
		params: {
			path: {
				movie_id: tmdbId
			}
		}
	}).then((res) => res.data?.results || []);

export const searchTmdbTitles = (query: string) =>
	TmdbApiOpen.GET('/3/search/multi', {
		params: {
			query: {
				query
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbItemBackdrop = (item: {
	images: { backdrops: { file_path: string; iso_639_1: string }[] };
}) =>
	(
		item?.images?.backdrops?.find((b) => b.iso_639_1 === get(settings)?.language) ||
		item?.images?.backdrops?.find((b) => b.iso_639_1 === 'en') ||
		item?.images?.backdrops?.find((b) => b.iso_639_1) ||
		item?.images?.backdrops?.[0]
	)?.file_path;

export const getPosterProps = async (
	item: {
		name?: string;
		title?: string;
		id?: number;
		vote_average?: number;
		number_of_seasons?: number;
		first_air_date?: string;
		poster_path?: string;
	},
	type: TitleType | undefined = undefined
) => {
	const backdropUri = item.poster_path;
	const t =
		type ||
		(item?.number_of_seasons === undefined && item?.first_air_date === undefined
			? 'movie'
			: 'series');
	return {
		tmdbId: item.id || 0,
		title: item.title || item.name || '',
		// subtitle: item.subtitle || '',
		rating: item.vote_average || undefined,
		size: 'md',
		backdropUrl: backdropUri ? TMDB_BACKDROP_SMALL + backdropUri : '',
		type: t,
		orientation: 'portrait'
	} as const;
};

export const getTmdbPerson = async (person_id: number) =>
	TmdbApiOpen.GET('/3/person/{person_id}', {
		params: {
			path: {
				person_id: person_id
			},
			query: {
				append_to_response: 'images,movie_credits,tv_credits,external_ids'
			}
		}
	}).then((res) => res.data as TmdbPersonFull);

export const TMDB_MOVIE_GENRES = [
	{
		id: 28,
		name: 'Action'
	},
	{
		id: 12,
		name: 'Adventure'
	},
	{
		id: 16,
		name: 'Animation'
	},
	{
		id: 35,
		name: 'Comedy'
	},
	{
		id: 80,
		name: 'Crime'
	},
	{
		id: 99,
		name: 'Documentary'
	},
	{
		id: 18,
		name: 'Drama'
	},
	{
		id: 10751,
		name: 'Family'
	},
	{
		id: 14,
		name: 'Fantasy'
	},
	{
		id: 36,
		name: 'History'
	},
	{
		id: 27,
		name: 'Horror'
	},
	{
		id: 10402,
		name: 'Music'
	},
	{
		id: 9648,
		name: 'Mystery'
	},
	{
		id: 10749,
		name: 'Romance'
	},
	{
		id: 878,
		name: 'Science Fiction'
	},
	{
		id: 10770,
		name: 'TV Movie'
	},
	{
		id: 53,
		name: 'Thriller'
	},
	{
		id: 10752,
		name: 'War'
	},
	{
		id: 37,
		name: 'Western'
	}
];

export const TMDB_SERIES_GENRES = [
	{
		id: 10759,
		name: 'Action & Adventure'
	},
	{
		id: 16,
		name: 'Animation'
	},
	{
		id: 35,
		name: 'Comedy'
	},
	{
		id: 80,
		name: 'Crime'
	},
	{
		id: 99,
		name: 'Documentary'
	},
	{
		id: 18,
		name: 'Drama'
	},
	{
		id: 10751,
		name: 'Family'
	},
	{
		id: 10762,
		name: 'Kids'
	},
	{
		id: 9648,
		name: 'Mystery'
	},
	{
		id: 10763,
		name: 'News'
	},
	{
		id: 10764,
		name: 'Reality'
	},
	{
		id: 10765,
		name: 'Sci-Fi & Fantasy'
	},
	{
		id: 10766,
		name: 'Soap'
	},
	{
		id: 10767,
		name: 'Talk'
	},
	{
		id: 10768,
		name: 'War & Politics'
	},
	{
		id: 37,
		name: 'Western'
	}
];
