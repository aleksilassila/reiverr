import { fetchTmdbMovie, TmdbApi } from '$lib/tmdb-api';
import type { TmdbMovie } from '$lib/tmdb-api';
import { getJellyfinContinueWatching } from '$lib/jellyfin/jellyfin';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const showcases = await TmdbApi.get('/movie/popular').then((res): TmdbMovie[] =>
		res.data.results.slice(0, 5)
	);

	const continueWatching = getJellyfinContinueWatching().then(async (items) => {
		const itemsFiltered = items?.filter((i) => i.ProviderIds?.Tmdb);
		if (!itemsFiltered?.length) return;

		console.log(itemsFiltered.map((i) => i.RunTimeTicks));

		const firstMovie = await fetchTmdbMovie(String(itemsFiltered[0].ProviderIds?.Tmdb));

		return {
			items: itemsFiltered?.map((i) => ({
				tmdbId: i.ProviderIds?.Tmdb,
				progress: i.UserData?.PlayedPercentage,
				length: (i.RunTimeTicks || 0) / 10_000_000 / 60
			})),
			backdrop: firstMovie.backdrop_path
		};
	});

	return {
		showcases,
		streamed: {
			continueWatching
		}
	};
}) satisfies PageServerLoad;
