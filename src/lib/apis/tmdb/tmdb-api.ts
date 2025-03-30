import { networks } from '$lib/components/Collection/collections';
import { formatDateToYearMonthDay } from '$lib/utils';
import createClient from 'openapi-fetch';
import { get } from 'svelte/store';
import { TMDB_API_KEY } from '../../constants';
import { sessions } from '../../stores/session.store';
import { settings } from '../../stores/settings.store';
import { user } from '../../stores/user.store';
import type { Api } from '../api.interface';
import {
	TmdbApiGenerated,
	type MovieCreditsData,
	type MovieDetailsData,
	type MovieExternalIdsData,
	type MovieImagesData,
	type MovieVideosData,
	type PersonDetailsData,
	type PersonExternalIdsData,
	type PersonImagesData,
	type PersonMovieCreditsData,
	type PersonTvCreditsData,
	type TvSeriesAggregateCreditsData,
	type TvSeriesDetailsData,
	type TvSeriesExternalIdsData,
	type TvSeriesImagesData,
	type TvSeriesVideosData
} from './tmdb-v3.openapi';
import { TmdbApi4Generated } from './tmdb-v4.openapi';
import type { operations, paths } from './tmdb.generated';
import type { paths as paths4 } from './tmdb4.generated';

const CACHE_ONE_DAY = 'max-age=86400';
const CACHE_FOUR_DAYS = 'max-age=345600';

export const getTmdbApi = (session = get(sessions).activeSession) => {
	if (!session) console.error('[TMDB API] No active session');

	return new TmdbApiNew({
		baseURL: `${session?.baseUrl}/api/tmdb/v3/proxy`,
		headers: {
			Authorization: `Bearer ${session?.token}`
		}
	});
};

export const getTmdbApi4 = ($user = get(user)) => {
	// if (!session) console.error('[TMDB API] No active session');
	if (!$user) console.error('[TMDB API] No user');

	return new TmdbApi4New({
		baseURL: 'https://api.themoviedb.org',
		headers: {
			Authorization: `Bearer ${$user?.settings.tmdb.sessionId}`
		}
	});
};

export class TmdbApiNew<S> extends TmdbApiGenerated<S> {
	getDiscoverySettings = () => {
		const language = get(settings)?.language;
		const region = get(settings)?.discover.region;
		const minimumVotes = 25; //get(settings)?.discover.minimumVotes;

		return {
			...(language ? { language } : {}),
			...(region ? { region } : {}),
			...(minimumVotes ? { 'vote_count.gte': minimumVotes } : {})
		};
	};

	getSeriesFlters = () => {
		const ignoredGenres = [10762, 10763, 10764, 10766, 10767, 16];
		const types = [4];

		return {
			...(ignoredGenres?.length ? { without_genres: ignoredGenres.join('|') } : {}),
			...(types?.length ? { with_type: types.join('|') } : {}),
			with_networks: Object.values(networks)
				.map((n) => n.id)
				.join('|')
			// include_null_first_air_dates: true
		};
	};

	// Series Discovery

	/** @deprecated */
	getPopularSeries = () =>
		this.v3
			.discoverTv({
				...this.getDiscoverySettings(),
				...this.getSeriesFlters(),
				sort_by: 'popularity.desc',
				// @ts-expect-error
				'first_air_date.lte': formatDateToYearMonthDay(new Date()),
				'air_date.lte': formatDateToYearMonthDay(new Date())
			})
			.then((res) => res.data.results || []);

	getTrendingSeries = () => this.v3.trendingTv('day').then((res) => res.data.results || []);

	getUpcomingSeries = () =>
		this.v3
			.discoverTv({
				...this.getDiscoverySettings(),
				...this.getSeriesFlters(),
				sort_by: 'popularity.desc',
				// @ts-expect-error
				'vote_count.gte': 0,
				'first_air_date.gte': formatDateToYearMonthDay(new Date()),
				// 'first_air_date.lte': formatDateToYearMonthDay(
				// 	new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
				// ),
				include_null_first_air_dates: false
				// @ts-ignore

				// 'first_air_date.gte': formatDateToYearMonthDay(
				// 	new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
				// ),
				// 'first_air_date.lte': formatDateToYearMonthDay(
				// 	new Date(Date.now() + 1000 * 60 * 60 * 24 * 28)
				// )
			})
			.then((res) => res.data.results || []);

	getNowStreamingSeries = () =>
		this.v3
			.discoverTv({
				...this.getDiscoverySettings(),
				...this.getSeriesFlters(),
				sort_by: 'popularity.desc',
				with_watch_monetization_types: 'flatrate|ads|rent|buy',
				watch_region: 'US',
				// @ts-expect-error
				'air_date.gte': formatDateToYearMonthDay(new Date()),
				'air_date.lte': formatDateToYearMonthDay(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7))
				// 'first_air_date.lte': formatDateToYearMonthDay(new Date())
			})
			.then((res) => res.data.results || []);

	// Movies Discovery

	/** @deprecated */
	getPopularMovies = () =>
		this.v3
			.discoverMovie({
				...this.getDiscoverySettings(),
				sort_by: 'popularity.desc',
				// @ts-expect-error
				'release_date.lte': formatDateToYearMonthDay(new Date())
			})
			.then((res) => res.data.results || []);

	getTrendingMovies = () => this.v3.trendingMovies('week').then((res) => res.data.results || []);

	getUpcomingMovies = () =>
		this.v3
			.discoverMovie({
				...this.getDiscoverySettings(),
				sort_by: 'popularity.desc',
				// @ts-expect-error
				'vote_count.gte': 0,
				with_release_type: 3,
				'release_date.gte': formatDateToYearMonthDay(
					new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
				),
				'release_date.lte': formatDateToYearMonthDay(
					new Date(Date.now() + 1000 * 60 * 60 * 24 * 28)
				)
			})
			.then((res) => res.data.results || []);

	getDigitalMovieReleases = () =>
		this.v3
			.discoverMovie({
				...this.getDiscoverySettings(),
				sort_by: 'popularity.desc',
				with_release_type: 4,
				// @ts-expect-error
				'release_date.lte': formatDateToYearMonthDay(new Date())
			})
			.then((res) => res.data.results || []);

	getPerson = async (person_id: number) =>
		this.v3
			.personDetails(person_id, {
				append_to_response: 'images,movie_credits,tv_credits,external_ids'
			})
			.then((res) => res.data);

	getMovieFull = async (tmdbId: number) =>
		this.v3
			.movieDetails(
				tmdbId,
				{
					append_to_response: 'videos,credits,external_ids,images'
				},
				{
					headers: {
						'Cache-Control': CACHE_ONE_DAY
					}
				}
			)
			.then((r) => r.data as TmdbMovieFull);

	getSeriesFull = async (tmdbId: number) =>
		this.v3
			.tvSeriesDetails(
				tmdbId,
				{
					append_to_response: 'videos,aggregate_credits,external_ids,images'
				},
				{
					headers: {
						'Cache-Control': CACHE_ONE_DAY
					}
				}
			)
			.then((r) => r.data as TmdbSeriesFull);
}

export class TmdbApi4New<S> extends TmdbApi4Generated<S> {
	getSessionId() {
		return get(user)?.settings.tmdb.sessionId;
	}

	getUserId() {
		return get(user)?.settings.tmdb.userId;
	}

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
				// this.getClient4l()
				// 	?.GET('/4/account/{account_object_id}/movie/recommendations', {
				// 		params: {
				// 			path: {
				// 				account_object_id: userId
				// 			},
				// 			query: {
				// 				page: i + 1
				// 			}
				// 		}
				// 	})
				// 	.then((res: any) => res.data?.results || [])
				this.v4
					.accountMovieRecommendations(userId, {
						page: i + 1
					})
					.then((r) => r.data.results || [])
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
				// this.getClient4l()
				// 	?.GET('/4/account/{account_object_id}/tv/recommendations', {
				// 		params: {
				// 			path: {
				// 				account_object_id: userId
				// 			},
				// 			query: {
				// 				page: i + 1
				// 			}
				// 		}
				// 	})
				// 	.then((res: any) => res.data?.results || [])
				this.v4
					.accountTvRecommendations(userId, {
						page: i + 1
					})
					.then((r) => r.data.results || [])
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
}

export type TmdbMovie = MovieDetailsData;
export type TmdbMovieSmall = NonNullable<
	operations['discover-movie']['responses']['200']['content']['application/json']['results']
>[0];
export type TmdbSeries = TvSeriesDetailsData;
export type TmdbSeriesSmall = NonNullable<
	operations['discover-tv']['responses']['200']['content']['application/json']['results']
>[0];
export type TmdbSeason =
	operations['tv-season-details']['responses']['200']['content']['application/json'];
export type TmdbSeasonEpisode = NonNullable<TmdbSeason['episodes']>[0];
// export type TmdbPerson =
// 	operations['person-details']['responses']['200']['content']['application/json'];
export type TmdbPerson = PersonDetailsData;
export type TmdbCredit =
	| NonNullable<TmdbSeriesFull['aggregate_credits']['cast']>[0]
	| NonNullable<TmdbMovieFull['credits']['cast']>[0];
export type TmdbEpisode =
	operations['tv-episode-details']['responses']['200']['content']['application/json'];

export interface TmdbPersonFull extends TmdbPerson {
	images: PersonImagesData;
	movie_credits: PersonMovieCreditsData;
	tv_credits: PersonTvCreditsData;
	external_ids: PersonExternalIdsData;
}

export interface TmdbMovieFull extends TmdbMovie {
	videos: MovieVideosData;
	credits: MovieCreditsData;
	external_ids: MovieExternalIdsData;
	images: MovieImagesData;
}

export interface TmdbSeriesFull extends TmdbSeries {
	videos: TvSeriesVideosData;
	aggregate_credits: TvSeriesAggregateCreditsData;
	external_ids: TvSeriesExternalIdsData;
	images: TvSeriesImagesData;
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
			.then((res) => res.data as TmdbMovieFull | undefined);
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
			.then((res) => res.data?.tv_results?.[0] as TmdbSeries | undefined);

	getTmdbSeries = async (tmdbId: number): Promise<TmdbSeriesFull | undefined> =>
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
			.then((res) => res.data as TmdbSeriesFull | undefined);

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
	}).then((res) => res.data as TmdbMovieFull | undefined);

export const getTmdbSeries = async (tmdbId: number): Promise<TmdbSeriesFull | undefined> =>
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
	}).then((res) => res.data as TmdbSeriesFull | undefined);

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
