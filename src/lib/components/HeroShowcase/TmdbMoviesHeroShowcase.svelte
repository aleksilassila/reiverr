<script lang="ts">
	import type { TmdbMovie2 } from '$lib/apis/tmdb/tmdb-api';
	import { formatMinutesToTime, formatThousands } from '$lib/utils';
	import { navigate } from '../StackRouter/StackRouter';
	import HeroShowcase from './HeroShowcase.svelte';
	import { tmdbApi } from '$lib/apis/tmdb/tmdb-api';

	export let movies: Promise<TmdbMovie2[]>;

	$: items = movies.then(async (movies) => {
		return Promise.all(
			movies.map(async (movie) => {
				const trailerUrl = movie.id
					? await tmdbApi.getMovieVideos(movie.id).then((videos) =>
							videos.find((video) => video.type === 'Trailer' && video.site === 'YouTube')?.key || ''
					  )
					: '';

				return {
					id: movie.id ?? 0,
					type: 'movie' as const,
					posterUri: movie.poster_path ?? '',
					backdropUri: movie.backdrop_path ?? '',
					title: movie.title ?? '',
					overview: movie.overview ?? '',
					trailerUrl: trailerUrl ?? '',
					infoProperties: [
						...(movie.release_date
							? [{ label: new Date(movie.release_date).getFullYear().toString() }]
							: []),
						...(movie.runtime ? [{ label: formatMinutesToTime(movie.runtime) }] : []),
						...(movie.vote_average
							? [
									{
										label: `${movie.vote_average.toFixed(1)} TMDB (${formatThousands(
											movie.vote_count ?? 0
										)})`,
										href: `https://www.themoviedb.org/movie/${movie.id}`
									}
							  ]
							: []),
						...(movie.genres ? [{ label: movie.genres.map((genre) => genre.name).join(', ') }] : [])
					]
				};
			})
		);
	});
</script>

<HeroShowcase on:select={({ detail }) => navigate(`/movie/${detail?.id}`)} {items} />
