import { scrollElementIntoView } from '$lib/scroll-into-view';
import type { Selectable } from '$lib/selectable';
import { usePaginatedRequest } from '$lib/stores/data.store';
import { seriesUserDataContext } from '$lib/stores/user-data/title-user-data.store';
import { tmdbApi } from '$lib/stores/user.store';
import { formatThousands, waitFor } from '$lib/utils';
import { derived, get, writable, type Writable } from 'svelte/store';
import type { TitleInfoProperty } from '../HeroTitleInfo';
import { useSeriesContext } from '$lib/stores/series-data.store';

type SelectedEpisode = { episode: number; season: number } | undefined;

function useCardHover(selectedEpisode: Writable<SelectedEpisode>) {
	let timeout: ReturnType<typeof setTimeout>;

	function onMouseEnter(episode: SelectedEpisode) {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			selectedEpisode.set(episode);
		}, 200);
	}

	function onMouseLeave() {
		if (timeout) clearTimeout(timeout);
		// timeout = setTimeout(() => {
		// 	selectedEpisode.set(undefined);
		// }, 200);
	}

	return {
		onEpisodeCardMouseEnter: onMouseEnter,
		onEpisodeCardMouseLeave: onMouseLeave
	};
}

export function useEpisodeCarousel(tmdbId: string) {
	const { seriesData, episodesData } = useSeriesContext(tmdbId).getContext(true);
	const selectedEpisode: Writable<SelectedEpisode> = writable(undefined);
	const cardHover = useCardHover(selectedEpisode);

	// const episodesRequest = usePaginatedRequest((p) =>
	// 	get(seriesData.promise)
	// 		.then((s) => tmdbApi.getSeasonFull(Number(s.id), p))
	// 		.then((r) => ({
	// 			items: r.episodes?.map((e) => ({ ...e, season: r })) ?? [],
	// 			total: 0,
	// 			itemsPerPage: 0,
	// 			page: p
	// 		}))
	// );

	const selectedTmdbEpisode = derived(
		[selectedEpisode, seriesData.data],
		([selectedEpisode, series]) => {
			const episode = series?.seasons
				?.map((s) => s.episodes ?? [])
				.flat()
				.find(
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

	// const unsubscribeNextEpisode = episodesData.subscribe(({ nextEpisode }) => {
	// 	if (nextEpisode?.season) episodesRequest.requestUntil(nextEpisode.season);
	// 	selectedEpisode.set(nextEpisode);
	// });

	const unsubs: Array<() => void> = [];
	function onEpisodeMount(s: Selectable, season: number, episode: number) {
		const { unsubscribe: unsubEarly } = waitFor(
			episodesData,
			(data) => !!data.nextEpisode,
			(data) => {
				if (data.nextEpisode?.season === season && data.nextEpisode?.episode === episode) {
					s.activate();
					scrollElementIntoView(s.getHtmlElement()!, { left: 128, instant: true });
				}
			}
		);

		// const unsub = episodesData.subscribe(({ nextEpisode }) => {
		// 	if (nextEpisode?.season === season && nextEpisode?.episode === episode) {
		// 		s.activate();
		// 		scrollElementIntoView(s.getHtmlElement()!, { left: 128, instant: true });
		// 	}
		// });

		unsubs.push(unsubEarly);
	}

	return {
		...cardHover,
		onEpisodeMount,
		selectedEpisode,
		selectedTmdbEpisode,
		unsubscribe: () => {
			// episodesRequest.unsubscribe();
			// unsubscribeNextEpisode();
			unsubs.forEach((unsub) => unsub());
		}
	};
}
