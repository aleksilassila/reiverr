<script lang="ts">
	import { sonarrApi, type SonarrRelease, type SonarrSeries } from '../../apis/sonarr/sonarr-api';
	import MMMainLayout from './MMMainLayout.svelte';
	import MMReleasesTab from './Releases/MMReleasesTab.svelte';
	import type { GrabReleaseFn } from './MediaManagerModal';
	import { onDestroy } from 'svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import type { Release } from '../../apis/combined-types';
	import MMSeasonSelectTab from './MMSeasonSelectTab.svelte';

	export let season: number | null = null;
	export let sonarrItem: SonarrSeries;
	export let modalId: symbol;
	export let hidden: boolean;
	export let onGrabRelease: (release: Release) => void = () => {};

	$: releases = season !== null ? getReleases(season) : null;

	let refreshDownloadsTimeout: ReturnType<typeof setTimeout>;

	const grabRelease: GrabReleaseFn = (release) =>
		sonarrApi.downloadSonarrRelease(release.guid || '', release.indexerId || -1).then((r) => {
			onGrabRelease(release);
			return r;
		});

	function getReleases(season: number) {
		return sonarrApi.getSeasonReleases(sonarrItem.id || -1, season);
	}

	function getDownloads(season: number) {
		return sonarrApi
			.getDownloadsBySeriesId(sonarrItem.id || -1)
			.then((ds) => ds.filter((d) => d.episode?.seasonNumber === season));
	}

	onDestroy(() => {
		clearTimeout(refreshDownloadsTimeout);
	});
</script>

<Dialog size="full" {modalId} {hidden}>
	{#if !season}
		<MMSeasonSelectTab />
	{:else if releases}
		<MMReleasesTab {releases} {grabRelease}>
			<h1 slot="title">{sonarrItem?.title}</h1>
			<h2 slot="subtitle">Season {season} Releases</h2>
		</MMReleasesTab>
	{/if}
</Dialog>
