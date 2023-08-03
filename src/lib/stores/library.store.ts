import {
	getJellyfinContinueWatching,
	getJellyfinItems,
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
	getTmdbSeriesBackdrop,
	getTmdbSeriesFromTvdbId
} from '$lib/apis/tmdb/tmdbApi';
import { get, writable } from 'svelte/store';

export interface PlayableItem {
	type: 'movie' | 'series';
	tmdbId: number;
	tmdbRating: number;
	cardBackdropUrl: string;
	download?: {
		progress: number;
		completionTime: string;
	};
	continueWatching?: {
		progress: number;
		length: number;
	};
	isPlayed: boolean;
	jellyfinId?: string;
	jellyfinItem?: JellyfinItem;
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

	const continueWatchingPromise = getJellyfinContinueWatching();
	const jellyfinLibraryItemsPromise = getJellyfinItems();

	const radarrMovies = await radarrMoviesPromise;
	const radarrDownloads = await radarrDownloadsPromise;

	const sonarrSeries = await sonarrSeriesPromise;
	const sonarrDownloads = await sonarrDownloadsPromise;

	const jellyfinContinueWatching = await continueWatchingPromise;
	const jellyfinLibraryItems = await jellyfinLibraryItemsPromise;

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
		const download =
			downloadProgress && completionTime
				? { progress: downloadProgress, completionTime }
				: undefined;

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

		const backdropUrl = await getTmdbMovieBackdrop(radarrMovie.tmdbId || 0);

		return {
			type: 'movie' as const,
			tmdbId: radarrMovie.tmdbId || 0,
			tmdbRating: radarrMovie.ratings?.tmdb?.value || 0,
			cardBackdropUrl: backdropUrl || '',
			download,
			continueWatching,
			isPlayed: jellyfinItem?.UserData?.Played || false,
			jellyfinId: jellyfinItem?.Id,
			jellyfinItem,
			radarrMovie,
			radarrDownloads: itemRadarrDownloads
		};
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
		const download =
			downloadProgress && completionTime
				? { progress: downloadProgress, completionTime }
				: undefined;

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

		const tmdbItem = sonarrSeries.tvdbId
			? await getTmdbSeriesFromTvdbId(sonarrSeries.tvdbId)
			: undefined;
		const tmdbId = tmdbItem?.id || undefined;

		const backdropUrl = tmdbId ? await getTmdbSeriesBackdrop(tmdbId) : undefined;

		return {
			type: 'series' as const,
			tmdbId: tmdbId || 0,
			tmdbRating: tmdbItem?.vote_average || 0,
			cardBackdropUrl: backdropUrl || '',
			download,
			continueWatching,
			isPlayed: jellyfinItem?.UserData?.Played || false,
			jellyfinId: jellyfinItem?.Id,
			jellyfinItem,
			sonarrSeries,
			sonarrDownloads: itemSonarrDownloads
		};
	});

	await Promise.all([...moviesPromise, ...seriesPromise]).then((r) =>
		r.forEach((item) => {
			items[item.tmdbId] = item;
		})
	);

	return {
		items,
		itemsArray: Object.values(items),
		continueWatching: Object.values(items).filter((i) => i.continueWatching)
	};
}

function createLibraryStore() {
	const { update, set, ...library } = writable<Promise<Library>>(getLibrary()); //TODO promise to undefined

	async function filterNotInLibrary<T extends any>(toFilter: T[], getTmdbId: (item: T) => any) {
		const libraryData = await get(library);

		return toFilter.filter((item) => !(getTmdbId(item) in libraryData.items));
	}

	return {
		...library,
		refresh: async () => getLibrary().then((r) => set(Promise.resolve(r))),
		filterNotInLibrary
	};
}

export const library = createLibraryStore();
