<script lang="ts">
	import { formatSize } from '$lib/utils.js';
	import { onMount } from 'svelte';
	import StatsPlaceholder from './StatsPlaceholder.svelte';
	import StatsContainer from './StatsContainer.svelte';
	import SonarrIcon from '../svgs/SonarrIcon.svelte';
	import { env } from '$env/dynamic/public';
	import { getDiskSpace } from '$lib/apis/sonarr/sonarrApi';
	import { library } from '$lib/stores/library.store';

	export let large = false;

	async function fetchStats() {
		const discSpacePromise = getDiskSpace();
		const { itemsArray } = await $library;
		const availableSeries = itemsArray.filter(
			(item) => item.sonarrSeries && item.sonarrSeries.statistics?.episodeFileCount
		);

		const diskSpaceInfo =
			(await discSpacePromise).find((disk) => disk.path === '/') || (await discSpacePromise)[0];

		const spaceOccupied = availableSeries.reduce(
			(acc, series) => acc + (series.sonarrSeries?.statistics?.sizeOnDisk || 0),
			0
		);

		const episodesCount = availableSeries.reduce(
			(acc, series) => acc + (series.sonarrSeries?.statistics?.episodeFileCount || 0),
			0
		);

		return {
			episodesCount,
			spaceLeft: diskSpaceInfo.freeSpace || 0,
			spaceOccupied,
			spaceTotal: diskSpaceInfo.totalSpace || 0
		};
	}
</script>

{#await fetchStats()}
	<StatsPlaceholder {large} />
{:then { episodesCount, spaceLeft, spaceOccupied, spaceTotal }}
	<StatsContainer
		{large}
		title="Sonarr"
		subtitle="Shows Provider"
		href={env.PUBLIC_SONARR_BASE_URL}
		stats={[
			{ title: 'Episodes', value: String(episodesCount) },
			{ title: 'Space Taken', value: formatSize(spaceOccupied) },
			{ title: 'Space Left', value: formatSize(spaceLeft) }
		]}
		fillPercentage={((spaceTotal - spaceLeft) / spaceTotal) * 100}
		color="#8aacfd21"
	>
		<SonarrIcon slot="icon" class="absolute opacity-20 p-4 h-full inset-y-0 right-2" />
	</StatsContainer>
{/await}
