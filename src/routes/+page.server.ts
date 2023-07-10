import { getTmdbMovie, getTmdbPopularMovies, TmdbApi } from '$lib/apis/tmdb/tmdbApi';
import type { TmdbMovie } from '$lib/apis/tmdb/tmdbApi';
import { getJellyfinContinueWatching } from '$lib/apis/jellyfin/jellyfinApi';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const showcases = (await getTmdbPopularMovies()).slice(0, 5);

	const continueWatching = getJellyfinContinueWatching().then(async (items) => {
		const itemsFiltered = items?.filter((i) => i.ProviderIds?.Tmdb);
		if (!itemsFiltered?.length) return;

		return {
			items: itemsFiltered?.map((i) => ({
				tmdbId: i.ProviderIds?.Tmdb,
				progress: i.UserData?.PlayedPercentage,
				length: (i.RunTimeTicks || 0) / 10_000_000 / 60
			}))
		};
	});

	return {
		showcases,
		streamed: {
			continueWatching
		}
	};
}) satisfies PageServerLoad;
