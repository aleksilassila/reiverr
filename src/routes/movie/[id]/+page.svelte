<script lang="ts">
	import ResourceDetails from '$lib/components/ResourceDetails/ResourceDetails.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

{#if data.movie}
	{@const movie = data.movie}
	<ResourceDetails
		tmdbId={movie?.id || 0}
		type="movie"
		title={movie?.title || ''}
		releaseDate={new Date(movie?.release_date || Date.now())}
		tagline={movie?.tagline || ''}
		overview={movie?.overview || ''}
		genres={movie?.genres?.map((g) => g.name || '') || []}
		runtime={movie?.runtime || 0}
		tmdbRating={movie?.vote_average || 0}
		starring={movie?.credits?.cast?.slice(0, 5)}
		videos={movie.videos?.results || []}
		backdropPath={movie?.backdrop_path || ''}
		showDetails={true}
	/>
{/if}
