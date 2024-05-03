<script lang="ts">
	import { sonarrApi } from '../../apis/sonarr/sonarr-api';
	import MMMainLayout from './MMMainLayout.svelte';
	import MMAddToSonarr from './MMAddToSonarr.svelte';
	import MMModal from './MMModal.svelte';
	import ReleaseList from './Releases/MMReleasesTab.svelte';
	import DownloadList from '../MediaManager/DownloadList.svelte';
	import FileList from './LocalFiles/MMLocalFilesTab.svelte';
	import { log } from '../../utils';
	import type { Release } from '../../apis/combined-types';
	import type {
		CancelDownloadFn,
		CancelDownloadsFn,
		DeleteFileFn,
		DeleteFilesFn,
		GrabReleaseFn
	} from './MediaManagerModal';
	import { onDestroy } from 'svelte';
	import MMReleasesTab from './Releases/MMReleasesTab.svelte';
	import MMLocalFilesTab from './LocalFiles/MMLocalFilesTab.svelte';
	import MMTitle from './MMTitle.svelte';

	export let id: number; // Tmdb ID
	export let season: number;
	export let episode: number;
	export let modalId: symbol;
	export let hidden: boolean;

	const sonarrItem = sonarrApi.getSeriesByTmdbId(id);

	const sonarrEpisode = sonarrItem.then((si) =>
		sonarrApi
			.getEpisodes(si?.id || -1, season)
			.then((episodes) => episodes.find((e) => e.episodeNumber === episode))
	);

	let releases: Promise<Release[]> = getReleases();
	// let files = getLocalFiles();
	// let downloads = getDownloads();

	// let refreshDownloadsTimeout: ReturnType<typeof setTimeout>;

	const grabRelease: GrabReleaseFn = (release) =>
		sonarrApi.downloadSonarrRelease(release.guid || '', release.indexerId || -1).then((r) => {
			// refreshDownloadsTimeout = setTimeout(() => {
			// 	downloads = getDownloads();
			// }, 8000);
			return r;
		});

	// const deleteFile: DeleteFileFn = (...args) =>
	// 	sonarrApi.deleteSonarrEpisode(...args).then((r) => {
	// 		files = getLocalFiles();
	// 		return r;
	// 	});
	// const deleteFiles: DeleteFilesFn = (...args) =>
	// 	sonarrApi.deleteSonarrEpisodes(...args).then((r) => {
	// 		files = getLocalFiles();
	// 		return r;
	// 	});
	// const cancelDownload: CancelDownloadFn = (...args) =>
	// 	sonarrApi.cancelDownload(...args).then((r) => {
	// 		downloads = getDownloads();
	// 		return r;
	// 	});
	// const cancelDownloads: CancelDownloadsFn = (...args) =>
	// 	sonarrApi.cancelDownloads(...args).then((r) => {
	// 		downloads = getDownloads();
	// 		return r;
	// 	});

	function getReleases() {
		return sonarrEpisode.then((se) => sonarrApi.getEpisodeReleases(se?.id || -1));
	}

	// function getLocalFiles() {
	// 	return sonarrItem.then((si) => sonarrApi.getFilesBySeriesId(si?.id || -1)); // TODO
	// }
	//
	// function getDownloads() {
	// 	return sonarrItem
	// 		.then((si) => sonarrApi.getDownloadsBySeriesId(si?.id || -1))
	// 		.then((ds) =>
	// 			ds.filter((d) => d.episode?.seasonNumber === season && d.episode?.episodeNumber === episode)
	// 		);
	// }

	// onDestroy(() => {
	// 	clearTimeout(refreshDownloadsTimeout);
	// });
</script>

<MMModal {modalId} {hidden}>
	{#await sonarrEpisode then sonarrEpisode}
		{#if !sonarrEpisode}
			<MMAddToSonarr />
		{:else}
			<div class="pt-20 h-screen flex flex-col">
				<MMTitle class="mb-32 mx-32">
					<h1 slot="title">{sonarrEpisode?.title}</h1>
					<h2 slot="subtitle">Season {season} Episode {episode}</h2>
				</MMTitle>
				<div class="mx-20 flex-1 overflow-y-auto scrollbar-hide pb-20">
					<MMReleasesTab {releases} {grabRelease} />
				</div>
			</div>
		{/if}
	{/await}
</MMModal>
