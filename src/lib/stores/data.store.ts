import { get, writable } from 'svelte/store';
import { tmdbApi, type TmdbMovieFull2, type TmdbSeriesFull2 } from '../apis/tmdb/tmdb-api';
import { awaitAppInitialization, reiverrApiNew, user } from './user.store';

export function useRequest<TResponse>(fn: () => Promise<TResponse>) {
	async function _createPromise() {
		return awaitAppInitialization().then(() => fn());
	}

	const initialPromise = _createPromise();
	const promise = writable(initialPromise);
	const isLoading = writable(true);
	const data = writable<TResponse | undefined>(undefined);
	initialPromise.then((d) => {
		data.set(d);
		isLoading.set(false);
	});

	async function refresh() {
		isLoading.set(true);

		return _createPromise().then((d) => {
			data.set(d);
			promise.set(Promise.resolve(d));
			isLoading.set(false);
			return d;
		});
	}

	let updateTimeout: NodeJS.Timeout;
	function refreshIn(ms = 1500) {
		return new Promise((resolve) => {
			clearTimeout(updateTimeout);
			updateTimeout = setTimeout(() => {
				refresh().then(resolve);
			}, ms);
		});
	}

	return {
		subscribe: data.subscribe,
		isLoading,
		promise,
		refresh,
		refreshIn
	};
}

export function useRequestsStore<TArgs extends Array<unknown>, TResponse>(
	fn: (...args: TArgs) => Promise<TResponse>,
	options: { persistant?: boolean } = {}
) {
	type Res = ReturnType<typeof useRequest<TResponse>>;
	const requests: Map<string, { subscribers: symbol[]; request: Res }> = new Map();

	function subscribe(...args: TArgs): Res & { unsubscribe: () => void } {
		const id = Symbol();
		let request = requests.get(JSON.stringify(args))?.request;

		if (!request) {
			request = useRequest(() => fn(...args));
			requests.set(JSON.stringify(args), {
				subscribers: [id],
				request
			});
		} else {
			requests.get(JSON.stringify(args))?.subscribers.push(id);
		}

		return {
			...request,
			unsubscribe: () => {
				const subscribers = requests.get(JSON.stringify(args))?.subscribers;
				const index = subscribers?.indexOf(id) ?? -1;
				if (index !== -1) {
					subscribers?.splice(index, 1);
				}

				if (subscribers?.length === 0 && options.persistant !== true) {
					requests.delete(JSON.stringify(args));
				}
			}
		};
	}

	function _get(...args: TArgs) {
		const res = subscribe(...args);
		res.unsubscribe();
		return get(res.promise);
	}

	const refresh = async (...args: TArgs) => {
		const request = requests.get(JSON.stringify(args))?.request;

		if (request) {
			return request.refresh();
		}
	};

	const refreshIn = async (ms: number, ...args: TArgs) => {
		const request = requests.get(JSON.stringify(args))?.request;

		if (request) {
			return request.refreshIn(ms);
		}
	};

	return {
		subscribe,
		get: _get,
		refresh,
		refreshIn
	};
}

export const tmdbMovieDataStore = useRequestsStore((id: number) => tmdbApi.getTmdbMovie(id));
export const tmdbSeriesDataStore = useRequestsStore((id: number) => tmdbApi.getTmdbSeries(id));
export const tmdbEpisodeDataStore = useRequestsStore(
	(tmdbId: number, season: number, episode: number) => tmdbApi.getEpisode(tmdbId, season, episode)
);

export const movieUserDataStore = useRequestsStore((id: string) =>
	reiverrApiNew.users.getMovieUserData(get(user)?.id as string, id).then((r) => r.data)
);
export const seriesUserDataStore = useRequestsStore((id: string) =>
	reiverrApiNew.users.getSeriesUserData(get(user)?.id as string, id).then((r) => r.data)
);
export const episodeUserDataStore = useRequestsStore(
	(id: string, season: number, episode: number) =>
		reiverrApiNew.users
			.getEpisodeUserData(get(user)?.id as string, id, season, episode)
			.then((r) => r.data)
);

export const libraryItemsDataStore = useRequestsStore(
	() =>
		reiverrApiNew.users
			.getLibraryItems(get(user)?.id as string)
			.then((r) =>
				r.data.items.map((i) => ({
					...i,
					metadata:
						(i.movieMetadata?.tmdbMovie as TmdbMovieFull2) ||
						(i.seriesMetadata?.tmdbSeries as TmdbSeriesFull2)
				}))
			)
			.then((i) => i.filter((i) => !!i.metadata)),
	{ persistant: true }
);

export const mediaSourcesDataStore = useRequestsStore(() =>
	reiverrApiNew.users
		.findUserById(get(user)?.id || '')
		.then((r) => r.data.mediaSources?.sort((a, b) => a.priority - b.priority) ?? [])
);
