<script lang="ts">
	import { sonarrApi, type SonarrSeason } from '../../apis/sonarr/sonarr-api';
	import { useRequest } from '../../stores/data.store';
	import Button from '../Button.svelte';
	import { scrollIntoView } from '../../selectable';

	export let id: number;
	export let selectSeason: (seasonNumber: number) => void;

	const { promise: sonarrSeries } = useRequest(sonarrApi.getSeriesById, id);
</script>

<div class="flex flex-col -my-1">
	{#await $sonarrSeries then series}
		{#if series?.seasons}
			{#each series.seasons.filter((s) => s.seasonNumber !== 0) as season, i}
				<div class="flex-1 my-1">
					<Button
						on:clickOrSelect={() => selectSeason(season.seasonNumber || i + 1)}
						on:enter={scrollIntoView({ vertical: 64 })}
					>
						<div class="mr-2">
							Season {season.seasonNumber}
						</div>
						{#if season.statistics}
							<div class="text-zinc-400">{season.statistics.totalEpisodeCount} Episodes</div>
						{/if}
					</Button>
				</div>
			{/each}
		{/if}
	{/await}
</div>
