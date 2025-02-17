<script lang="ts">
	import type { TmdbSeries2 } from '$lib/apis/tmdb/tmdb-api';
	import { formatThousands } from '$lib/utils';
	import { navigate } from '../StackRouter/StackRouter';
	import HeroShowcase from './HeroShowcase.svelte';
	import { tmdbApi } from '$lib/apis/tmdb/tmdb-api';
	import { Video } from 'radix-icons-svelte';

	export let series: Promise<TmdbSeries2[]>;

	$: items = series.then(async (series) => {
		return Promise.all(
			series.map(async (series) => {
				const seriesFull = await tmdbApi.getTmdbSeries(series.id ?? 0);
				const videoUrl = seriesFull?.videos?.results?.find(
					(video) => video.type === 'Trailer' && video.site === 'YouTube'
				)?.key;

				return {
					id: series.id ?? 0,
					type: 'tv' as const,
					posterUri: series.poster_path ?? '',
					backdropUri: series.backdrop_path ?? '',
					title: series.name ?? '',
					overview: series.overview ?? '',
					videoUrl,
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
						...(series.genres
							? [{ label: series.genres.map((genre) => genre.name).join(', ') }]
							: []),
						...(videoUrl
							? [{ icon: Video, href: `https://www.youtube.com/watch?v=${videoUrl}` }]
							: [])
					]
				};
			})
		);
	});
</script>

<HeroShowcase on:select={({ detail }) => navigate(`/series/${detail?.id}`)} {items} />
