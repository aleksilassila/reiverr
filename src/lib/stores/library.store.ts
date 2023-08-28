import {
	getJellyfinContinueWatching,
	getJellyfinEpisodes,
	getJellyfinItems,
	getJellyfinNextUp,
	type JellyfinItem
} from '$lib/apis/jellyfin/jellyfinApi';
import {
	getRadarrDownloads,
	getRadarrMovies,
	type RadarrDownload,
	type RadarrMovie
} from '$lib/apis/radarr/radarrApi';
import {
	getSonarrDownloads,
	getSonarrSeries,
	type SonarrDownload,
	type SonarrSeries
} from '$lib/apis/sonarr/sonarrApi';
import {
	getTmdbMovieBackdrop,
	getTmdbMoviePoster,
	getTmdbSeriesBackdrop,
	getTmdbSeriesFromTvdbId
} from '$lib/apis/tmdb/tmdbApi';
import { TMDB_BACKDROP_SMALL, TMDB_POSTER_SMALL } from '$lib/constants';
import type { TitleType } from '$lib/types';
import { derived, get, writable, type Stores, type Writable } from 'svelte/store';
import { settings } from './settings.store';

export interface PlayableItem {
	tmdbRating: number;
	backdropUrl: string;
	posterUrl: string;
	download?: {
		progress: number;
		completionTime: string | undefined;
	};
	continueWatching?: {
		progress: number;
		length: number;
	};
	isPlayed: boolean;
	jellyfinId?: string;

	type: TitleType;
	tmdbId: number;
	jellyfinItem?: JellyfinItem;
	jellyfinEpisodes?: JellyfinItem[];
	nextJellyfinEpisode?: JellyfinItem;
	radarrMovie?: RadarrMovie;
	radarrDownloads?: RadarrDownload[];
	sonarrSeries?: SonarrSeries;
	sonarrDownloads?: SonarrDownload[];
}

export interface Library {
	items: Record<string, PlayableItem>;
	itemsArray: PlayableItem[];
	continueWatching: PlayableItem[];
}

async function getLibrary(): Promise<Library> {
	const radarrMoviesPromise = getRadarrMovies();
	const radarrDownloadsPromise = getRadarrDownloads();

	const sonarrSeriesPromise = getSonarrSeries();
	const sonarrDownloadsPromise = getSonarrDownloads();

	const jellyfinContinueWatchingPromise = getJellyfinContinueWatching();
	const jellyfinNextUpPromise = getJellyfinNextUp();
	const jellyfinLibraryItemsPromise = getJellyfinItems();
	const jellyfinEpisodesPromise = getJellyfinEpisodes();

	const radarrMovies = await radarrMoviesPromise;
	const radarrDownloads = await radarrDownloadsPromise;

	const sonarrSeries = await sonarrSeriesPromise;
	const sonarrDownloads = await sonarrDownloadsPromise;

	const jellyfinContinueWatching = (await jellyfinContinueWatchingPromise) || [];
	const jellyfinLibraryItems = (await jellyfinLibraryItemsPromise) || [];
	const jellyfinEpisodes =
		(await jellyfinEpisodesPromise.then((episodes) =>
			episodes?.sort((a, b) => (a.IndexNumber || 99) - (b.IndexNumber || 99))
		)) || [];
	const jellyfinNextUp = await jellyfinNextUpPromise;

	const items: Record<string, PlayableItem> = {};

	const moviesPromise: Promise<PlayableItem>[] = radarrMovies.map(async (radarrMovie) => {
		const itemRadarrDownloads = radarrDownloads.filter(
			(d) => d.movie.tmdbId === radarrMovie.tmdbId
		);
		const radarrDownload = itemRadarrDownloads[0];
		const jellyfinItem = jellyfinLibraryItems.find(
			(i) => i.ProviderIds?.Tmdb === String(radarrMovie.tmdbId)
		);

		const downloadProgress =
			radarrDownload?.sizeleft && radarrDownload?.size
				? ((radarrDownload.size - radarrDownload.sizeleft) / radarrDownload.size) * 100
				: undefined;
		const completionTime = radarrDownload?.estimatedCompletionTime || undefined;
		const download = downloadProgress ? { progress: downloadProgress, completionTime } : undefined;

		const length = jellyfinItem?.RunTimeTicks
			? jellyfinItem.RunTimeTicks / 10_000_000 / 60
			: undefined;
		const watchingProgress = jellyfinItem?.UserData?.PlayedPercentage;
		const continueWatching =
			length &&
			watchingProgress &&
			!!jellyfinContinueWatching.find((i) => i.Id === jellyfinItem?.Id)
				? { length, progress: watchingProgress }
				: undefined;

		const backdropUri = await getTmdbMovieBackdrop(radarrMovie.tmdbId || 0);
		const posterUri = await getTmdbMoviePoster(radarrMovie.tmdbId || 0);

		const playableItem: PlayableItem = {
			type: 'movie' as const,
			tmdbId: radarrMovie.tmdbId || 0,
			tmdbRating: radarrMovie.ratings?.tmdb?.value || 0,
			backdropUrl: backdropUri ? TMDB_BACKDROP_SMALL + backdropUri : '',
			posterUrl: posterUri ? TMDB_POSTER_SMALL + posterUri : '',
			download,
			continueWatching,
			isPlayed: jellyfinItem?.UserData?.Played || false,
			jellyfinId: jellyfinItem?.Id,
			jellyfinItem,
			radarrMovie,
			radarrDownloads: itemRadarrDownloads
		};

		return playableItem;
	});

	const seriesPromise: Promise<PlayableItem>[] = sonarrSeries.map(async (sonarrSeries) => {
		const itemSonarrDownloads = sonarrDownloads.filter(
			(d) => d.series.tvdbId === sonarrSeries.tvdbId
		);
		const sonarrDownload = itemSonarrDownloads[0];
		const jellyfinItem = jellyfinLibraryItems.find(
			(i) => i.ProviderIds?.Tvdb === String(sonarrSeries.tvdbId)
		);

		const downloadProgress =
			sonarrDownload?.sizeleft && sonarrDownload?.size
				? ((sonarrDownload.size - sonarrDownload.sizeleft) / sonarrDownload.size) * 100
				: undefined;
		const completionTime = sonarrDownload?.estimatedCompletionTime || undefined;
		const download = downloadProgress ? { progress: downloadProgress, completionTime } : undefined;

		const nextJellyfinEpisode = jellyfinItem
			? jellyfinContinueWatching.find((i) => i.SeriesId === jellyfinItem?.Id) ||
			  jellyfinNextUp?.find((i) => i.SeriesId === jellyfinItem?.Id)
			: undefined;

		const length = nextJellyfinEpisode?.RunTimeTicks
			? nextJellyfinEpisode.RunTimeTicks / 10_000_000 / 60
			: undefined;
		const watchingProgress = nextJellyfinEpisode?.UserData?.PlayedPercentage;
		const continueWatching =
			length && watchingProgress && !!nextJellyfinEpisode
				? { length, progress: watchingProgress }
				: undefined;

		const tmdbItem = sonarrSeries.tvdbId
			? await getTmdbSeriesFromTvdbId(sonarrSeries.tvdbId)
			: undefined;
		const tmdbId = tmdbItem?.id || undefined;

		const backdropUrl = await getTmdbSeriesBackdrop(tmdbId || 0);
		const posterUri = tmdbItem?.poster_path || '';

		const playableItem: PlayableItem = {
			type: 'series' as const,
			tmdbId: tmdbId || 0,
			tmdbRating: tmdbItem?.vote_average || 0,
			backdropUrl: backdropUrl ? TMDB_BACKDROP_SMALL + backdropUrl : '',
			posterUrl: posterUri ? TMDB_POSTER_SMALL + posterUri : '',
			download,
			continueWatching,
			isPlayed: jellyfinItem?.UserData?.Played || false,
			jellyfinId: jellyfinItem?.Id,
			jellyfinItem,
			sonarrSeries,
			sonarrDownloads: itemSonarrDownloads,
			jellyfinEpisodes: jellyfinEpisodes.filter((i) => i.SeriesId === jellyfinItem?.Id),
			nextJellyfinEpisode
		};

		return playableItem;
	});

	const jellyfinSourceItems = jellyfinLibraryItems
		.filter(
			(i) =>
				!radarrMovies.find((m) => m.tmdbId === Number(i.ProviderIds?.Tmdb)) &&
				!sonarrSeries.find((s) => s.tvdbId === Number(i.ProviderIds?.Tvdb))
		)
		.map((jellyfinItem) => {
			const itemJellyfinEpisodes = jellyfinEpisodes.filter((e) => e.SeriesId === jellyfinItem.Id);
			const jellyfinNextUpEpisode =
				jellyfinNextUp?.find((e) => e.SeriesId === jellyfinItem.Id) ||
				jellyfinContinueWatching.find((e) => e.SeriesId === jellyfinItem.Id);

			const length = jellyfinNextUpEpisode?.RunTimeTicks
				? jellyfinNextUpEpisode.RunTimeTicks / 10_000_000 / 60
				: undefined;
			const watchingProgress = jellyfinNextUpEpisode?.UserData?.PlayedPercentage;
			const continueWatching =
				length && watchingProgress && !!jellyfinNextUpEpisode
					? { length, progress: watchingProgress }
					: undefined;

			const tmdbId = Number(jellyfinItem.ProviderIds?.Tmdb);
			const backdropUrl = jellyfinItem.BackdropImageTags?.length
				? `${get(settings).jellyfin.baseUrl}/Items/${
						jellyfinItem?.Id
				  }/Images/Backdrop?quality=100&tag=${jellyfinItem?.BackdropImageTags?.[0]}`
				: '';
			const posterUri = jellyfinItem.ImageTags?.Primary
				? `${get(settings).jellyfin.baseUrl}/Items/${
						jellyfinItem?.Id
				  }/Images/Backdrop?quality=100&tag=${jellyfinItem?.ImageTags?.Primary}`
				: '';

			const type: TitleType = jellyfinItem.Type === 'Movie' ? 'movie' : 'series';

			const playableItem: PlayableItem = {
				type,
				tmdbId,
				tmdbRating: jellyfinItem.CommunityRating || 0,
				backdropUrl: backdropUrl,
				posterUrl: posterUri,
				continueWatching,
				isPlayed: jellyfinItem.UserData?.Played || false,
				jellyfinId: jellyfinItem.Id,
				jellyfinItem,
				jellyfinEpisodes: itemJellyfinEpisodes,
				nextJellyfinEpisode: jellyfinNextUpEpisode
			};

			return playableItem;
		});

	await Promise.all([...moviesPromise, ...seriesPromise, ...jellyfinSourceItems]).then((r) =>
		r.forEach((item) => {
			items[item.tmdbId] = item;
		})
	);

	return {
		items,
		itemsArray: Object.values(items),
		continueWatching: Object.values(items).filter(
			(i) => i.continueWatching || i.nextJellyfinEpisode
		)
	};
}

async function waitForSettings() {
	return new Promise((resolve) => {
		let resolved = false;
		settings.subscribe((settings) => {
			if (settings?.initialised && !resolved) {
				resolved = true;
				resolve(settings);
			}
		});
	});
}

let delayedRefreshTimeout: NodeJS.Timeout;
function createLibraryStore() {
	const { update, set, ...library } = writable<Promise<Library>>(
		waitForSettings().then(() => getLibrary())
	); //TODO promise to undefined

	async function filterNotInLibrary<T>(toFilter: T[], getTmdbId: (item: T) => number) {
		return toFilter;
		const libraryData = await get(library);

		return toFilter.filter((item) => !(getTmdbId(item) in libraryData.items));
	}

	return {
		...library,
		refresh: async (tmdbId: number | undefined = undefined) =>
			getLibrary().then((r) => set(Promise.resolve(r))),
		refreshIn: async (ms: number) => {
			clearTimeout(delayedRefreshTimeout);
			delayedRefreshTimeout = setTimeout(() => {
				getLibrary().then((r) => set(Promise.resolve(r)));
			}, ms);
		},
		filterNotInLibrary
	};
}

export const library = createLibraryStore();

type AwaitableStoreValue<R, T = { data?: R }> = {
	loading: boolean;
} & T;

function _createDataFetchStore<T>(fn: () => Promise<T>) {
	const store = writable<AwaitableStoreValue<T>>({
		loading: true,
		data: undefined
	});

	async function refresh() {
		store.update((s) => ({ ...s, loading: true }));
		return waitForSettings().then(() =>
			fn().then((data) => {
				store.set({ loading: false, data });
				return data;
			})
		);
	}

	let updateTimeout: NodeJS.Timeout;
	function refreshIn(ms = 1000) {
		return new Promise((resolve) => {
			clearTimeout(updateTimeout);
			updateTimeout = setTimeout(() => {
				refresh().then(resolve);
			}, ms);
		});
	}

	return {
		subscribe: store.subscribe,
		refresh,
		refreshIn,
		promise: refresh()
	};
}

export const jellyfinItemsStore = _createDataFetchStore(getJellyfinItems);

export function createJellyfinItemStore(tmdbId: number) {
	const store = derived(jellyfinItemsStore, (s) => {
		return {
			loading: s.loading,
			item: s.data?.find((i) => i.ProviderIds?.Tmdb === String(tmdbId))
		};
	});
	return {
		subscribe: store.subscribe,
		refresh: jellyfinItemsStore.refresh,
		refreshIn: jellyfinItemsStore.refreshIn,
		promise: new Promise<JellyfinItem | undefined>((resolve) => {
			store.subscribe((s) => {
				if (!s.loading) resolve(s.item);
			});
		})
	};
}

export const sonarrSeriesStore = _createDataFetchStore(getSonarrSeries);
export const radarrMoviesStore = _createDataFetchStore(getRadarrMovies);

export function createRadarrMovieStore(tmdbId: number) {
	return derived(radarrMoviesStore, (s) => {
		return {
			loading: s.loading,
			item: s.data?.find((i) => i.tmdbId === tmdbId),
			refresh: radarrMoviesStore.refresh,
			refreshIn: radarrMoviesStore.refreshIn
		};
	});
}

export function createSonarrItemStore(name: string) {
	function shorten(str: string) {
		return str.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
	}

	const store = derived(sonarrSeriesStore, (s) => {
		return {
			loading: s.loading,
			item: s.data?.find(
				(i) =>
					shorten(i.titleSlug || '') === shorten(name) ||
					i.alternateTitles?.find((t) => shorten(t.title || '') === shorten(name))
			)
		};
	});

	return {
		subscribe: store.subscribe,
		refresh: sonarrSeriesStore.refresh,
		refreshIn: sonarrSeriesStore.refreshIn
	};
}

export const sonarrDownloadsStore = _createDataFetchStore(getSonarrDownloads);
export const radarrDownloadsStore = _createDataFetchStore(getRadarrDownloads);

export function createRadarrDownloadStore(
	radarrMovieStore: ReturnType<typeof createRadarrMovieStore>
) {
	const store = writable<{ loading: boolean; downloads?: RadarrDownload[] }>({
		loading: true,
		downloads: undefined
	});

	const combinedStore = derived(
		[radarrMovieStore, radarrDownloadsStore],
		([movieStore, downloadsStore]) => ({ movieStore, downloadsStore })
	);

	combinedStore.subscribe(async (data) => {
		const movie = data.movieStore.item;
		const downloads = data.downloadsStore.data;

		if (!movie || !downloads) return;

		store.set({
			loading: false,
			downloads: downloads?.filter((d) => d.movie.tmdbId === movie?.tmdbId)
		});
	});

	return {
		subscribe: store.subscribe,
		refresh: async () => radarrDownloadsStore.refresh()
	};
}

export function createSonarrDownloadStore(
	sonarrItemStore: ReturnType<typeof createSonarrItemStore>
) {
	const store = writable<{ loading: boolean; downloads?: SonarrDownload[] }>({
		loading: true,
		downloads: undefined
	});

	const combinedStore = derived(
		[sonarrItemStore, sonarrDownloadsStore],
		([itemStore, downloadsStore]) => ({ itemStore, downloadsStore })
	);

	combinedStore.subscribe(async (data) => {
		const item = data.itemStore.item;
		const downloads = data.downloadsStore.data;

		if (!item || !downloads) return;

		store.set({
			loading: false,
			downloads: downloads?.filter((d) => d.series.id === item?.id)
		});
	});

	return {
		subscribe: store.subscribe,
		refresh: async () => sonarrDownloadsStore.refresh()
	};
}

export type LibraryItem = {
	jellyfinItem?: JellyfinItem;
};

function _createLibraryItemStore(tmdbId: number) {
	function getValue(jellyfinItems: JellyfinItem[]) {
		return jellyfinItems.find((i) => i.ProviderIds?.Tmdb === String(tmdbId));
	}

	const store = writable<{ loading: boolean; item?: LibraryItem }>({
		loading: true,
		item: undefined
	});

	jellyfinItemsStore.subscribe(async (data) => {
		const item = {
			jellyfinItem: getValue((await data).jellyfinItems || [])
		};
		store.set({ loading: false, item });
	});

	return {
		subscribe: store.subscribe,
		refresh: async () => jellyfinItemsStore.refresh()
	};
}

const itemStores: Record<string, ReturnType<typeof _createLibraryItemStore>> = {};

export type LibraryItemStore = ReturnType<typeof _createLibraryItemStore>;
export function createLibraryItemStore(tmdbId: number) {
	if (!itemStores[tmdbId]) {
		itemStores[tmdbId] = _createLibraryItemStore(tmdbId);
	}

	return itemStores[tmdbId];
}
