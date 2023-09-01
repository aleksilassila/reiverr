import { getJellyfinItems, type JellyfinItem } from '$lib/apis/jellyfin/jellyfinApi';
import {
	getRadarrDownloads,
	getRadarrMovies,
	type RadarrDownload
} from '$lib/apis/radarr/radarrApi';
import {
	getSonarrDownloads,
	getSonarrSeries,
	type SonarrDownload,
	type SonarrSeries
} from '$lib/apis/sonarr/sonarrApi';
import { derived, writable } from 'svelte/store';
import { settings } from './settings.store';

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

export function createJellyfinItemStore(tmdbId: number | Promise<number>) {
	const store = writable<{ loading: boolean; item?: JellyfinItem }>({
		loading: true,
		item: undefined
	});

	jellyfinItemsStore.subscribe(async (s) => {
		const awaited = await tmdbId;

		store.set({
			loading: s.loading,
			item: s.data?.find((i) => i.ProviderIds?.Tmdb === String(awaited))
		});
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
	const store = derived(radarrMoviesStore, (s) => {
		return {
			loading: s.loading,
			item: s.data?.find((i) => i.tmdbId === tmdbId)
		};
	});

	return {
		subscribe: store.subscribe,
		refresh: radarrMoviesStore.refresh,
		refreshIn: radarrMoviesStore.refreshIn
	};
}

export function createSonarrSeriesStore(name: Promise<string> | string) {
	function shorten(str: string) {
		return str.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
	}

	const store = writable<{ loading: boolean; item?: SonarrSeries }>({
		loading: true,
		item: undefined
	});

	sonarrSeriesStore.subscribe(async (s) => {
		const awaited = await name;

		store.set({
			loading: s.loading,
			item: s.data?.find(
				(i) =>
					shorten(i.titleSlug || '') === shorten(awaited) ||
					i.alternateTitles?.find((t) => shorten(t.title || '') === shorten(awaited))
			)
		});
	});

	return {
		subscribe: store.subscribe,
		refresh: sonarrSeriesStore.refresh,
		refreshIn: sonarrSeriesStore.refreshIn
	};
}

export const sonarrDownloadsStore = _createDataFetchStore(getSonarrDownloads);
export const radarrDownloadsStore = _createDataFetchStore(getRadarrDownloads);
export const servarrDownloadsStore = (() => {
	const store = derived([sonarrDownloadsStore, radarrDownloadsStore], ([sonarr, radarr]) => {
		return {
			loading: sonarr.loading || radarr.loading,
			radarrDownloads: radarr.data,
			sonarrDownloads: sonarr.data
		};
	});

	return {
		subscribe: store.subscribe
	};
})();

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
	sonarrItemStore: ReturnType<typeof createSonarrSeriesStore>
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
