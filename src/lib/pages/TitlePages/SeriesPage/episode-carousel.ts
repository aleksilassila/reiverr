import type { TmdbSeasonEpisode } from '$lib/apis/tmdb/tmdb-api';
import { scrollElementIntoView } from '$lib/scroll-into-view';
import type { Selectable } from '$lib/selectable';
import { usePaginatedRequest } from '$lib/stores/data.store';
import {
	seriesUserDataContext,
	type EpisodeData
} from '$lib/stores/user-data/title-user-data.store';
import { tmdbApi } from '$lib/stores/user.store';
import { derived, get, writable, type Writable } from 'svelte/store';
import type { TitleInfoProperty } from '../HeroTitleInfo';
import { formatThousands } from '$lib/utils';

export function useEpisodeCarousel() {
	const { tmdbId, tmdbSeries, nextEpisode } = seriesUserDataContext.getContext();
	const selectedEpisode: Writable<{ episode: number; season: number } | undefined> =
		writable(undefined);

	const episodesRequest = usePaginatedRequest((p) =>
		get(tmdbSeries)
			.then((s) => tmdbApi.getSeasonFull(Number(s.id), p))
			.then((r) => ({
				items: r.episodes?.map((e) => ({ ...e, season: r })) ?? [],
				total: 0,
				itemsPerPage: 0,
				page: p
			}))
	);

	const selectedTmdbEpisode = derived(
		[selectedEpisode, episodesRequest.data],
		([selectedEpisode, episodes]) => {
			const episode = episodes.find(
				(e) =>
					e.season_number === selectedEpisode?.season &&
					e.episode_number === selectedEpisode?.episode
			);

			if (!episode) return undefined;

			const properties: TitleInfoProperty[] = [];

			if (episode.air_date) {
				const date = new Date(episode.air_date);
				const dateFormatted = date.toLocaleDateString('en-US', {
					month: 'long',
					day: 'numeric',
					year: 'numeric'
				});

				properties.push({
					label:
						date.getTime() > Date.now() ? `Airs on ${dateFormatted}` : `Aired on ${dateFormatted}`
				});
			}

			if (episode.runtime) {
				properties.push({ label: `${episode.runtime} Minutes` });
			}

			if (episode?.vote_average) {
				properties.push({
					label: `${episode.vote_average.toFixed(1)} TMDB (${formatThousands(
						episode.vote_count ?? 0
					)})`,
					href: `https://www.themoviedb.org/tv/${tmdbId}`
				});
			}

			return {
				...episode,
				properties
			};
		}
	);

	const unsubscribeNextEpisode = nextEpisode.subscribe((nextEpisode) => {
		if (nextEpisode?.season) episodesRequest.requestUntil(nextEpisode.season);
		selectedEpisode.set(nextEpisode);
	});

	const unsubs: Array<() => void> = [];
	function onEpisodeMount(s: Selectable, season: number, episode: number) {
		const unsub = nextEpisode.subscribe((nextEpisode) => {
			if (nextEpisode?.season === season && nextEpisode?.episode === episode) {
				s.activate();
				scrollElementIntoView(s.getHtmlElement()!, { left: 128, instant: true });
			}
		});

		unsubs.push(unsub);
	}

	return {
		...episodesRequest,
		onEpisodeMount,
		selectedEpisode,
		selectedTmdbEpisode,
		unsubscribe: () => {
			episodesRequest.unsubscribe();
			unsubscribeNextEpisode();
			unsubs.forEach((unsub) => unsub());
		}
	};
}
