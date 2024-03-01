<script lang="ts">
	import { getDiskSpace } from '$lib/apis/radarr/radarrApi';
	import { radarrMoviesStore } from '$lib/stores/data.store';
	import { settings } from '$lib/stores/settings.store';
	import { formatSize } from '$lib/utils.js';
	import RadarrIcon from '../svgs/RadarrIcon.svelte';
	import StatsContainer from './StatsContainer.svelte';
	import StatsPlaceholder from './StatsPlaceholder.svelte';

	export let large = false;

	async function fetchStats() {
		const discSpacePromise = getDiskSpace();
		const radarrMovies = await radarrMoviesStore.promise;
		const availableMovies = radarrMovies.filter((item) => item.isAvailable && item.movieFile);

		const diskSpaceInfo =
			(await discSpacePromise).find((disk) => disk.path === '/') ||
			(await discSpacePromise)[0] ||
			undefined;

		const spaceOccupied = availableMovies.reduce((acc, movie) => acc + (movie?.sizeOnDisk || 0), 0);

		return {
			moviesCount: availableMovies.length,
			spaceLeft: diskSpaceInfo?.freeSpace || 0,
			spaceOccupied,
			spaceTotal: diskSpaceInfo?.totalSpace || 0
		};
	}
</script>

{#await fetchStats()}
	<StatsPlaceholder {large} />
{:then { moviesCount, spaceLeft, spaceOccupied, spaceTotal }}
	<StatsContainer
		{large}
		title="Radarr"
		subtitle="Movies Provider"
		href={$settings.radarr.baseUrl || '#'}
		stats={[
			{ title: 'Movies', value: String(moviesCount) },
			{ title: 'Space Taken', value: formatSize(spaceOccupied) },
			{ title: 'Space Left', value: formatSize(spaceLeft) }
		]}
		fillPercentage={((spaceTotal - spaceLeft) / spaceTotal) * 100}
	>
		<RadarrIcon slot="icon" class="absolute opacity-20 p-4 h-full inset-y-0 right-2" />
	</StatsContainer>
{/await}
