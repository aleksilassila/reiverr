<script lang="ts">
	import { sonarrApi } from '../../apis/sonarr/sonarr-api';
	import MMMainLayout from './MMMainLayout.svelte';
	import MMAddToSonarr from './MMAddToSonarr.svelte';
	import MMModal from '../MediaManager/MMModal.svelte';
	import ReleaseList from '../MediaManager/ReleaseList.svelte';
	import DownloadList from '../MediaManager/DownloadList.svelte';
	import FileList from '../MediaManager/FileList.svelte';

	export let id: number; // Tmdb ID
	export let season: number;
	export let modalId: symbol;
	export let hidden: boolean;

	const sonarrItem = sonarrApi.getSeriesByTmdbId(id);
	const downloads = sonarrItem.then((si) => sonarrApi.getDownloadsBySeriesId(si?.id || -1));
	const files = sonarrItem.then((si) => sonarrApi.getFilesBySeriesId(si?.id || -1));

	const getReleases = () =>
		sonarrItem.then((si) => sonarrApi.getSeasonReleases(si?.id || -1, season));
	const selectRelease = () => {};

	const cancelDownload = sonarrApi.cancelDownloadSonarrEpisode;
	const handleSelectFile = () => {};
</script>

<MMModal {modalId} {hidden}>
	{#await sonarrItem then series}
		{#if !series}
			<MMAddToSonarr />
		{:else}
			<MMMainLayout>
				<h1 slot="title">{series?.title}</h1>
				<h2 slot="subtitle">Season {season} Packs</h2>
				<ReleaseList slot="releases" {getReleases} {selectRelease} />
				<DownloadList slot="downloads" {downloads} {cancelDownload} />
				<FileList slot="local-files" {files} {handleSelectFile} />
			</MMMainLayout>
		{/if}
	{/await}
</MMModal>
