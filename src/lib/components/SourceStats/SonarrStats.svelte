<script lang="ts">
	import { formatSize } from '$lib/utils.js';
	import { onMount } from 'svelte';
	import StatsPlaceholder from './StatsPlaceholder.svelte';
	import StatsContainer from './StatsContainer.svelte';
	import SonarrIcon from '../svgs/SonarrIcon.svelte';
	import { PUBLIC_SONARR_BASE_URL } from '$env/static/public';

	export let large = false;

	let statsRequest: Promise<{ moviesAmount: number }> = new Promise((_) => {}) as any;

	onMount(() => {
		statsRequest = fetch('/radarr/stats')
			.then((res) => res.json())
			.then((data) => ({
				moviesAmount: data?.movies?.length
			}));
	});
</script>

{#await statsRequest}
	<StatsPlaceholder {large} />
{:then { moviesAmount }}
	<StatsContainer
		{large}
		title="Sonarr"
		subtitle="Shows Provider"
		href={PUBLIC_SONARR_BASE_URL}
		stats={[
			{ title: 'Movies', value: String(moviesAmount) },
			{ title: 'Space Taken', value: formatSize(120_000_000_000) },
			{ title: 'Space Left', value: formatSize(50_000_000_000) }
		]}
		color="#8aacfd21"
	>
		<SonarrIcon slot="icon" class="absolute opacity-20 p-4 h-full inset-y-0 right-2" />
	</StatsContainer>
{/await}
