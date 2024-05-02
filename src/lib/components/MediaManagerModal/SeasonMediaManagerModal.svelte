<script lang="ts">
	import { sonarrApi } from '../../apis/sonarr/sonarr-api';
	import MMMainLayout from './MMMainLayout.svelte';
	import MMAddToSonarr from './MMAddToSonarr.svelte';
	import MMModal from './MMModal.svelte';
	import MMReleasesTab from './Releases/MMReleasesTab.svelte';
	import MMLocalFilesTab from './LocalFiles/MMLocalFilesTab.svelte';
	import type {
		CancelDownloadFn,
		CancelDownloadsFn,
		DeleteFileFn,
		DeleteFilesFn,
		GrabReleaseFn
	} from './MediaManagerModal';
	import type { Release } from '../../apis/combined-types';
	import { onDestroy } from 'svelte';

	export let id: number; // Tmdb ID
	export let season: number;
	export let modalId: symbol;
	export let hidden: boolean;

	const sonarrItem = sonarrApi.getSeriesByTmdbId(id);

	let releases: Promise<Release[]> = getReleases();
	let files = getLocalFiles();
	let downloads = getDownloads();

	let refreshDownloadsTimeout: ReturnType<typeof setTimeout>;

	const grabRelease: GrabReleaseFn = (release) =>
		sonarrApi.downloadSonarrRelease(release.guid || '', release.indexerId || -1).then((r) => {
			refreshDownloadsTimeout = setTimeout(() => {
				downloads = getDownloads();
			}, 8000);
			return r;
		});

	const deleteFile: DeleteFileFn = (...args) =>
		sonarrApi.deleteSonarrEpisode(...args).then((r) => {
			files = getLocalFiles();
			return r;
		});
	const deleteFiles: DeleteFilesFn = (...args) =>
		sonarrApi.deleteSonarrEpisodes(...args).then((r) => {
			files = getLocalFiles();
			return r;
		});
	const cancelDownload: CancelDownloadFn = (...args) =>
		sonarrApi.cancelDownload(...args).then((r) => {
			downloads = getDownloads();
			return r;
		});
	const cancelDownloads: CancelDownloadsFn = (...args) =>
		sonarrApi.cancelDownloads(...args).then((r) => {
			downloads = getDownloads();
			return r;
		});

	function getReleases() {
		return sonarrItem.then((si) => sonarrApi.getSeasonReleases(si?.id || -1, season));
	}

	function getLocalFiles() {
		return sonarrItem.then((si) => sonarrApi.getFilesBySeriesId(si?.id || -1));
	}

	function getDownloads() {
		return sonarrItem
			.then((si) => sonarrApi.getDownloadsBySeriesId(si?.id || -1))
			.then((ds) => ds.filter((d) => d.episode?.seasonNumber === season));
	}

	onDestroy(() => {
		clearTimeout(refreshDownloadsTimeout);
	});
</script>

<MMModal {modalId} {hidden}>
	{#await sonarrItem then series}
		{#if !series}
			<MMAddToSonarr />
		{:else}
			<MMMainLayout>
				<h1 slot="title">{series?.title}</h1>
				<h2 slot="subtitle">Season {season} Packs</h2>
				<MMReleasesTab slot="releases" {releases} {grabRelease} />
				<MMLocalFilesTab
					slot="local-files"
					{files}
					{deleteFile}
					{deleteFiles}
					{downloads}
					{cancelDownload}
					{cancelDownloads}
				/>
				<!--				<DownloadList slot="downloads" {downloads} {cancelDownload} />-->
			</MMMainLayout>
		{/if}
	{/await}
</MMModal>
