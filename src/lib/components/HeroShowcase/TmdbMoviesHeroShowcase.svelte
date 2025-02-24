<script lang="ts">
	import type { TmdbMovie2 } from '$lib/apis/tmdb/tmdb-api';
	import { formatMinutesToTime, formatThousands } from '$lib/utils';
	import HeroShowcase from './HeroShowcase.svelte';
	import { tmdbApi } from '$lib/apis/tmdb/tmdb-api';
	import { Video } from 'radix-icons-svelte';
	import StackLink from '../StackRouter/StackLink.svelte';

	export let movies: Promise<TmdbMovie2[]>;
	let selectedMovieId: number | undefined = -1;

	$: items = movies
		.then(async (movies) => {
			selectedMovieId = movies[0]?.id;
			return movies.map(async (movie) => {
				const movieFull = await tmdbApi.getTmdbMovie(movie.id ?? 0);
				const videoUrl = movieFull?.videos?.results?.find(
					(video) => video.type === 'Trailer' && video.site === 'YouTube'
				)?.key;

				return {
					id: movie.id ?? 0,
					type: 'movie' as const,
					posterUri: movie.poster_path ?? '',
					backdropUri: movie.backdrop_path ?? '',
					title: movie.title ?? '',
					overview: movie.overview ?? '',
					videoUrl,
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
						...(movie.genres
							? [{ label: movie.genres.map((genre) => genre.name).join(', ') }]
							: []),
						...(videoUrl
							? [{ icon: Video, href: `https://www.youtube.com/watch?v=${videoUrl}` }]
							: [])
					]
				};
			});
		})
		.then((i) => Promise.all(i));
</script>

<StackLink on:click to="/movie/{selectedMovieId}">
	<HeroShowcase
		on:enter={({ detail }) => {
			selectedMovieId = detail?.id;
		}}
		{items}
	/>
</StackLink>
