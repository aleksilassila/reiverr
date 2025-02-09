<script lang="ts">
	import type { TmdbMovie2, TmdbSeries2 } from '$lib/apis/tmdb/tmdb-api';
	import { formatMinutesToTime, formatThousands } from '$lib/utils';
	import { navigate } from '../StackRouter/StackRouter';
	import HeroShowcase from './HeroShowcase.svelte';

	export let series: Promise<TmdbSeries2[]>;
	$: items = series.then((series) =>
		series.map((series) => ({
			id: series.id ?? 0,
			type: 'movie' as const,
			posterUri: series.poster_path ?? '',
			backdropUri: series.backdrop_path ?? '',
			title: `${series.name}`,
			overview: series.overview ?? '',
			infoProperties: [
				...(series.status !== 'Ended'
					? [{ label: `Since ${new Date(series.first_air_date ?? 0).getFullYear()}` }]
					: series.last_air_date
					? [{ label: `Ended ${new Date(series.last_air_date).getFullYear()}` }]
					: []),
				...(series.vote_average
					? [
							{
								label: `${series.vote_average.toFixed(1)} TMDB (${formatThousands(
									series.vote_count ?? 0
								)})`,
								href: `https://www.themoviedb.org/tv/${series.id}`
							}
					  ]
					: []),
				...(series.genres ? [{ label: series.genres.map((genre) => genre.name).join(', ') }] : [])
			]
		}))
	);
</script>

<HeroShowcase on:select={({ detail }) => navigate(`/series/${detail?.id}`)} {items} />
