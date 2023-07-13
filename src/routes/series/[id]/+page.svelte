<script lang="ts">
	import ResourceDetails from '$lib/components/ResourceDetails/ResourceDetails.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
	console.log(data.series);
</script>

{#if data.series}
	{@const series = data.series}
	{@const lastEpisode = series.last_episode_to_air}
	<ResourceDetails
		tmdbId={series.id || 0}
		type="tv"
		title={series.name || ''}
		releaseDate={new Date(series.first_air_date || Date.now())}
		endDate={series.last_air_date && !series.in_production
			? new Date(series.last_air_date)
			: undefined}
		seasons={series.number_of_seasons || 0}
		tagline={series.tagline || ''}
		overview={series.overview || ''}
		backdropPath={series.backdrop_path || ''}
		genres={series.genres?.map((g) => g.name || '') || []}
		runtime={series.episode_run_time?.[0] || 0}
		tmdbRating={series.vote_average || 0}
		starring={series.credits?.cast || []}
		videos={series.videos?.results || []}
		showDetails={true}
		lastEpisode={lastEpisode?.still_path && lastEpisode?.name
			? {
					backdropPath: lastEpisode.still_path,
					title: lastEpisode.name,
					subtitle: 'Latest Episode',
					runtime: lastEpisode.runtime || 0,
					episodeNumber:
						(lastEpisode.season_number ? `S${lastEpisode.season_number}` : '') +
						(lastEpisode.episode_number ? `E${lastEpisode.episode_number}` : '')
			  }
			: undefined}
	/>
{/if}
