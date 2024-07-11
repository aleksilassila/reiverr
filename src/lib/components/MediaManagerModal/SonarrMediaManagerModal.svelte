<script lang="ts">
	import { sonarrApi, type SonarrEpisode, type SonarrSeries } from '../../apis/sonarr/sonarr-api';
	import MMReleasesTab from './Releases/MMReleasesTab.svelte';
	import type { GrabReleaseFn } from './MediaManagerModal';
	import { onDestroy } from 'svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import type { Release } from '../../apis/combined-types';
	import MMSeasonSelectTab from './MMSeasonSelectTab.svelte';
	import { retry } from '../../utils';
	import Modal from '../Modal/Modal.svelte';

	export let season: number | undefined = undefined;
	export let sonarrItem: SonarrSeries | SonarrEpisode;
	export let onGrabRelease: (release: Release) => void = () => {};

	export let modalId: symbol;
	export let hidden: boolean;

	$: releases = getReleases(season);

	let refreshDownloadsTimeout: ReturnType<typeof setTimeout>;

	const grabRelease: GrabReleaseFn = (release) =>
		sonarrApi.downloadSonarrRelease(release.guid || '', release.indexerId || -1).then((r) => {
			onGrabRelease(release);
			return r;
		});

	function getReleases(season?: number) {
		if (season)
			return retry(
				() => sonarrApi.getSeasonReleases(sonarrItem.id || -1, season),
				(v) => !!v?.length,
				{ retries: 2 }
			);
		else
			return retry(
				() => sonarrApi.getEpisodeReleases(sonarrItem.id || -1),
				(v) => !!v?.length,
				{ retries: 2 }
			);
	}

	onDestroy(() => {
		clearTimeout(refreshDownloadsTimeout);
	});
</script>

<Modal class="bg-secondary-900 pt-16 px-20" {modalId} {hidden}>
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
</Modal>
