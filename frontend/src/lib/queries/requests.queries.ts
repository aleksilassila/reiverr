import type {
	EpisodeRefDto,
	MediaRequestDto,
	MovieRequestRuleDto,
	RequestRuleDto,
	RequestSourceDto,
	SeriesRequestsDto,
	SetRequestSourceDto
} from '$lib/apis/reiverr/reiverr.openapi';
import { reiverrApi } from '$lib/stores/user.store';
import { queryOptions, type QueryKey } from '@tanstack/svelte-query';
import { catalogKeys } from './catalog.queries';
import { libraryKeys } from './library.queries';
import { invalidate, type MediaType } from './query-client';
import { storageKeys } from './storage.queries';

export const requestsKeys = {
	/** Every document: what a change on the server's files invalidates */
	all: ['requests'] as const,
	/** The requests, the rule and the sources of the user: what their actions change */
	title: (mediaType: MediaType, tmdbId: string) => [...requestsKeys.all, mediaType, tmdbId] as const
};

export const episodeKey = (season: number, episode: number) => `${season}-${episode}`;

/** The requests document, keyed by {@link episodeKey}; a season pack selection has episode 0 */
export type SeriesRequests = {
	requests: Map<string, MediaRequestDto>;
	rule: RequestRuleDto;
	/** The releases and files the current user selected */
	sources: Map<string, RequestSourceDto>;
};

function toSeriesRequests(requests: SeriesRequestsDto): SeriesRequests {
	return {
		requests: new Map(requests.requests.map((r) => [episodeKey(r.season, r.episode), r])),
		rule: requests.rule,
		sources: new Map(requests.sources.map((p) => [episodeKey(p.season, p.episode), p]))
	};
}

export const requestsQueries = {
	/** The requests of the user for the series, with the rule and the sources they are fulfilled by */
	series: (tmdbId: string) =>
		queryOptions({
			queryKey: requestsKeys.title('series', tmdbId),
			queryFn: () => reiverrApi.requests.getSeriesRequests(tmdbId).then((r) => r.data),
			select: toSeriesRequests
		}),
	/** The request of the user for the movie, with the rule and the source it is fulfilled by */
	movie: (tmdbId: string) =>
		queryOptions({
			queryKey: requestsKeys.title('movie', tmdbId),
			queryFn: () => reiverrApi.requests.getMovieRequests(tmdbId).then((r) => r.data)
		})
};

/**
 * What follows a change of the requests of a title: the requests and their status, the usage, and
 * the lists, which show whether the user requested the title
 */
export const requestsChangedKeys = (mediaType: MediaType, tmdbId: string): QueryKey[] => [
	requestsKeys.title(mediaType, tmdbId),
	libraryKeys.status(mediaType, tmdbId),
	storageKeys.all,
	catalogKeys.all
];

export async function setSeriesRequests(
	tmdbId: string,
	episodes: EpisodeRefDto[],
	requested: boolean
) {
	await reiverrApi.requests.setSeriesRequests(tmdbId, { episodes, requested });
	await invalidate(...requestsChangedKeys('series', tmdbId));
}

export async function setMovieRequested(tmdbId: string, requested: boolean) {
	await (requested
		? reiverrApi.requests.createMovieRequest(tmdbId)
		: reiverrApi.requests.deleteMovieRequest(tmdbId));
	await invalidate(...requestsChangedKeys('movie', tmdbId));
}

/** The rule may let requests through or delete watched ones; the usage lists the rule of the title */
export async function updateSeriesRequestRule(tmdbId: string, rule: RequestRuleDto) {
	await reiverrApi.requests.updateSeriesRequestRule(tmdbId, rule);
	await invalidate(...requestsChangedKeys('series', tmdbId));
}

/** The rule may delete the watched request; the usage lists the rule of the title */
export async function updateMovieRequestRule(tmdbId: string, rule: MovieRequestRuleDto) {
	await reiverrApi.requests.updateMovieRequestRule(tmdbId, rule);
	await invalidate(...requestsChangedKeys('movie', tmdbId));
}

/** Selects a release or a file for the episode, or a season pack without an episode */
export async function setSeriesSource(
	tmdbId: string,
	season: number,
	episode: number | undefined,
	source: SetRequestSourceDto
) {
	await (episode === undefined
		? reiverrApi.requests.setSeasonSource(tmdbId, season, source)
		: reiverrApi.requests.setEpisodeSource(tmdbId, season, episode, source));
	// What the requests have and download, and so what they take, follows the source
	await invalidate(...requestsChangedKeys('series', tmdbId));
}

export async function clearSeriesSource(
	tmdbId: string,
	season: number,
	episode: number | undefined
) {
	await (episode === undefined
		? reiverrApi.requests.clearSeasonSource(tmdbId, season)
		: reiverrApi.requests.clearEpisodeSource(tmdbId, season, episode));
	await invalidate(...requestsChangedKeys('series', tmdbId));
}

/** Selects a release or a file for the movie */
export async function setMovieSource(tmdbId: string, source: SetRequestSourceDto) {
	await reiverrApi.requests.setMovieSource(tmdbId, source);
	// What the request has and downloads, and so what it takes, follows the source
	await invalidate(...requestsChangedKeys('movie', tmdbId));
}

export async function clearMovieSource(tmdbId: string) {
	await reiverrApi.requests.clearMovieSource(tmdbId);
	await invalidate(...requestsChangedKeys('movie', tmdbId));
}
