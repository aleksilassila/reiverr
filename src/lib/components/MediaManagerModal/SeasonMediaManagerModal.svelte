<script lang="ts">
	import { sonarrApi, type SonarrEpisode, type SonarrSeries } from '../../apis/sonarr/sonarr-api';
	import MMReleasesTab from './Releases/MMReleasesTab.svelte';
	import type { GrabReleaseFn } from './MediaManagerModal';
	import { onDestroy } from 'svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import type { Release } from '../../apis/combined-types';
	import MMSeasonSelectTab from './MMSeasonSelectTab.svelte';

	export let season: number | undefined = undefined;
	export let sonarrItem: SonarrSeries | SonarrEpisode;
	export let modalId: symbol;
	export let hidden: boolean;
	export let onGrabRelease: (release: Release) => void = () => {};

	$: releases = getReleases(season);

	let refreshDownloadsTimeout: ReturnType<typeof setTimeout>;

	const grabRelease: GrabReleaseFn = (release) =>
		sonarrApi.downloadSonarrRelease(release.guid || '', release.indexerId || -1).then((r) => {
			onGrabRelease(release);
			return r;
		});

	function getReleases(season?: number) {
		if (season) return sonarrApi.getSeasonReleases(sonarrItem.id || -1, season);
		else return sonarrApi.getEpisodeReleases(sonarrItem.id || -1);
	}

	onDestroy(() => {
		clearTimeout(refreshDownloadsTimeout);
	});
</script>

<Dialog size="full" {modalId} {hidden}>
	{#if 'seasons' in sonarrItem && !season}
		<MMSeasonSelectTab />
	{:else}
		<MMReleasesTab {releases} {grabRelease}>
			<h1 slot="title">{sonarrItem?.title}</h1>
			<h2 slot="subtitle">
				{#if season}
					Season {season} Releases
				{:else if 'episodeNumber' in sonarrItem}
					Episode {sonarrItem.episodeNumber} Releases
				{/if}
			</h2>
		</MMReleasesTab>
	{/if}
</Dialog>
