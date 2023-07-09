<script lang="ts">
	import { formatSize, log } from '$lib/utils.js';
	import StatsPlaceholder from './StatsPlaceholder.svelte';
	import StatsContainer from './StatsContainer.svelte';
	import RadarrIcon from '../svgs/RadarrIcon.svelte';

	export let large = false;

	async function fetchStats() {
		return fetch('/radarr/stats')
			.then((res) => res.json())
			.then(log)
			.then((data) => ({
				moviesAmount: data?.movies?.length
			}));
	}
</script>

{#await fetchStats()}
	<StatsPlaceholder {large} />
{:then { moviesAmount }}
	<StatsContainer
		{large}
		title="Radarr"
		subtitle="Movies Provider"
		stats={[
			{ title: 'Movies', value: String(moviesAmount) },
			{ title: 'Space Taken', value: formatSize(120_000_000_000) },
			{ title: 'Space Left', value: formatSize(50_000_000_000) }
		]}
	>
		<RadarrIcon slot="icon" class="absolute opacity-20 p-4 h-full inset-y-0 right-2" />
	</StatsContainer>
{/await}
