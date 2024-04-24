<script lang="ts">
	import MMMainLayout from './MMMainLayout.svelte';
	import MMAddToSonarr from './MMAddToSonarr.svelte';
	import MMModal from '../MediaManager/MMModal.svelte';
	import ReleaseList from '../MediaManager/ReleaseList.svelte';
	import DownloadList from '../MediaManager/DownloadList.svelte';
	import FileList from '../MediaManager/FileList.svelte';
	import { radarrApi } from '../../apis/radarr/radarr-api';

	export let id: number; // Tmdb ID
	export let modalId: symbol;
	export let hidden: boolean;

	const radarrItem = radarrApi.getMovieByTmdbId(id);
	const downloads = radarrItem.then((i) => radarrApi.getDownloadsById(i?.id || -1));
	const files = radarrItem.then((i) => radarrApi.getFilesByMovieId(i?.id || -1));

	const getReleases = () => radarrItem.then((si) => radarrApi.getReleases(si?.id || -1));
	const selectRelease = () => {};

	const cancelDownload = radarrApi.cancelDownloadRadarrMovie;
	const handleSelectFile = () => {};
</script>

<MMModal {modalId} {hidden}>
	{#await radarrItem then movie}
		{#if !movie}
			<MMAddToSonarr />
		{:else}
			<MMMainLayout>
				<h1 slot="title">{movie?.title}</h1>
				<ReleaseList slot="releases" {getReleases} {selectRelease} />
				<DownloadList slot="downloads" {downloads} {cancelDownload} />
				<FileList slot="local-files" {files} {handleSelectFile} />
			</MMMainLayout>
		{/if}
	{/await}
</MMModal>
