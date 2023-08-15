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
import { get, writable } from 'svelte/store';

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
				? `http://jellyfin.home/Items/${jellyfinItem?.Id}/Images/Backdrop?quality=100&tag=${jellyfinItem?.BackdropImageTags?.[0]}`
				: '';
			const posterUri = jellyfinItem.ImageTags?.Primary
				? `http://jellyfin.home/Items/${jellyfinItem?.Id}/Images/Backdrop?quality=100&tag=${jellyfinItem?.ImageTags?.Primary}`
				: '';

			console.log(jellyfinItem);

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

let delayedRefreshTimeout: NodeJS.Timeout;
function createLibraryStore() {
	const { update, set, ...library } = writable<Promise<Library>>(getLibrary()); //TODO promise to undefined

	async function filterNotInLibrary<T>(toFilter: T[], getTmdbId: (item: T) => number) {
		const libraryData = await get(library);

		return toFilter.filter((item) => !(getTmdbId(item) in libraryData.items));
	}

	return {
		...library,
		refresh: async () => getLibrary().then((r) => set(Promise.resolve(r))),
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

function _createLibraryItemStore(tmdbId: number) {
	const store = writable<{ loading: boolean; item?: PlayableItem }>({
		loading: true,
		item: undefined
	});

	library.subscribe(async (library) => {
		const item = (await library).items[tmdbId];
		store.set({ loading: false, item });
	});

	return {
		subscribe: store.subscribe
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
