import { tmdbApi as legacyTmdbApi, type TmdbPersonFull } from '$lib/apis/tmdb/tmdb-api';
import { tmdbApi, tmdbApi4, user } from '$lib/stores/user.store';
import { queryOptions } from '@tanstack/svelte-query';
import { invalidate, pagedQueryOptions } from './query-client';

/** The backend's proxy caches TMDB for a day */
const HOUR = 3_600_000;

type MediaType = 'movie' | 'series';

export const tmdbKeys = {
	trending: (mediaType: MediaType) => ['tmdb', 'trending', mediaType] as const,
	upcoming: (mediaType: MediaType) => ['tmdb', 'upcoming', mediaType] as const,
	nowStreaming: () => ['tmdb', 'now-streaming'] as const,
	digitalReleases: () => ['tmdb', 'digital-releases'] as const,
	/** Everything read with the user's TMDB account: what connecting or disconnecting it invalidates */
	account: () => ['tmdb', 'account'] as const,
	accountDetails: () => ['tmdb', 'account', 'details'] as const,
	recommended: (mediaType: MediaType) => ['tmdb', 'account', 'recommended', mediaType] as const,
	series: (tmdbId: number) => ['tmdb', 'series', tmdbId] as const,
	movie: (tmdbId: number) => ['tmdb', 'movie', tmdbId] as const,
	seriesRecommendations: (tmdbId: number) => ['tmdb', 'series', tmdbId, 'recommendations'] as const,
	movieRecommendations: (tmdbId: number) => ['tmdb', 'movie', tmdbId, 'recommendations'] as const,
	person: (personId: number) => ['tmdb', 'person', personId] as const,
	search: (query: string) => ['tmdb', 'search', query] as const,
	network: (networkId: number | undefined) => ['tmdb', 'network', networkId ?? null] as const,
	company: (companyId: number) => ['tmdb', 'company', companyId] as const,
	companyMovies: (companyId: number | undefined) =>
		['tmdb', 'company', companyId ?? null, 'movies'] as const,
	list: (listId: number | undefined) => ['tmdb', 'list', listId ?? null] as const
};

export const tmdbQueries = {
	trending: (mediaType: MediaType) =>
		queryOptions({
			queryKey: tmdbKeys.trending(mediaType),
			queryFn: () =>
				mediaType === 'series' ? tmdbApi.getTrendingSeries() : tmdbApi.getTrendingMovies(),
			staleTime: HOUR
		}),
	upcomingSeries: () =>
		queryOptions({
			queryKey: tmdbKeys.upcoming('series'),
			queryFn: () => tmdbApi.getUpcomingSeries(),
			staleTime: HOUR
		}),
	upcomingMovies: () =>
		queryOptions({
			queryKey: tmdbKeys.upcoming('movie'),
			queryFn: () => tmdbApi.getUpcomingMovies(),
			staleTime: HOUR
		}),
	nowStreaming: () =>
		queryOptions({
			queryKey: tmdbKeys.nowStreaming(),
			queryFn: () => tmdbApi.getNowStreamingSeries(),
			staleTime: HOUR
		}),
	digitalReleases: () =>
		queryOptions({
			queryKey: tmdbKeys.digitalReleases(),
			queryFn: () => tmdbApi.getDigitalMovieReleases(),
			staleTime: HOUR
		}),
	/** The TMDB account the user connected, if any */
	accountDetails: () =>
		queryOptions({
			queryKey: tmdbKeys.accountDetails(),
			queryFn: async () => (await legacyTmdbApi.getAccountDetails()) ?? null,
			staleTime: HOUR
		}),
	/** Recommendations for the account, by genre; empty without an account */
	recommendedSeries: () =>
		queryOptions({
			queryKey: tmdbKeys.recommended('series'),
			queryFn: () => tmdbApi4.getRecommendedSeries(),
			staleTime: HOUR
		}),
	recommendedMovies: () =>
		queryOptions({
			queryKey: tmdbKeys.recommended('movie'),
			queryFn: () => tmdbApi4.getRecommendedMovies(),
			staleTime: HOUR
		}),
	/** The full document, with videos, credits and images */
	series: (tmdbId: number) =>
		queryOptions({
			queryKey: tmdbKeys.series(tmdbId),
			queryFn: () => tmdbApi.getSeriesFull(tmdbId),
			staleTime: HOUR
		}),
	movie: (tmdbId: number) =>
		queryOptions({
			queryKey: tmdbKeys.movie(tmdbId),
			queryFn: () => tmdbApi.getMovieFull(tmdbId),
			staleTime: HOUR
		}),
	seriesRecommendations: (tmdbId: number) =>
		queryOptions({
			queryKey: tmdbKeys.seriesRecommendations(tmdbId),
			queryFn: () => tmdbApi.v3.tvSeriesRecommendations(tmdbId).then((r) => r.data.results ?? []),
			staleTime: HOUR
		}),
	movieRecommendations: (tmdbId: number) =>
		queryOptions({
			queryKey: tmdbKeys.movieRecommendations(tmdbId),
			queryFn: () =>
				tmdbApi.v3.movieRecommendations(tmdbId).then((r) => (r.data as any).results ?? []),
			staleTime: HOUR
		}),
	/** The person with their images, credits and external ids */
	person: (personId: number) =>
		queryOptions({
			queryKey: tmdbKeys.person(personId),
			queryFn: () => tmdbApi.getPerson(personId).then((person) => person as TmdbPersonFull),
			staleTime: HOUR
		}),
	/** Movies, series and people */
	search: (query: string) =>
		queryOptions({
			queryKey: tmdbKeys.search(query),
			queryFn: () => tmdbApi.v3.searchMulti({ query }).then((r) => r.data.results ?? []),
			enabled: !!query,
			staleTime: HOUR
		}),
	/** The series of a network; nothing for a network TMDB does not know */
	network: (networkId: number | undefined) => ({
		...pagedQueryOptions({
			queryKey: tmdbKeys.network(networkId),
			queryFn: (page) =>
				tmdbApi.v3.discoverTv({ with_networks: networkId, page }).then((r) => r.data.results ?? [])
		}),
		enabled: networkId !== undefined,
		staleTime: HOUR
	}),
	company: (companyId: number) =>
		queryOptions({
			queryKey: tmdbKeys.company(companyId),
			queryFn: () => tmdbApi.v3.companyDetails(companyId).then((r) => r.data),
			staleTime: HOUR
		}),
	/** The movies of a production company */
	companyMovies: (companyId: number | undefined) => ({
		...pagedQueryOptions({
			queryKey: tmdbKeys.companyMovies(companyId),
			queryFn: (page) =>
				tmdbApi.v3
					.discoverMovie({ with_companies: String(companyId), page })
					.then((r) => r.data.results ?? [])
		}),
		enabled: companyId !== undefined,
		staleTime: HOUR
	}),
	/** The titles of a TMDB list */
	list: (listId: number | undefined) => ({
		...pagedQueryOptions({
			queryKey: tmdbKeys.list(listId),
			queryFn: (page) =>
				tmdbApi.v3.listDetails(listId ?? 0, { page }).then((r) => r.data.items ?? [])
		}),
		enabled: listId !== undefined,
		staleTime: HOUR
	})
};

/** The first step of connecting a TMDB account: a token for the user to approve on TMDB */
export const requestTmdbToken = () => legacyTmdbApi.getConnectAccountLink();

/** The second step, once the user approved the token */
export const requestTmdbAccessToken = (requestToken: string) =>
	legacyTmdbApi.getAccountAccessToken(requestToken);

/** Saves the account to the user, or removes it with empty ids */
export async function setTmdbAccount(account: { userId: string; sessionId: string }) {
	const error = await user.updateUser((current) => ({
		...current,
		settings: { ...current.settings, tmdb: account }
	}));
	if (error) throw error;
	await invalidate(tmdbKeys.account());
}
