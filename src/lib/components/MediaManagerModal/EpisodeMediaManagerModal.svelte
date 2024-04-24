<script lang="ts">
	import { sonarrApi } from '../../apis/sonarr/sonarr-api';
	import MMMainLayout from './MMMainLayout.svelte';
	import MMAddToSonarr from './MMAddToSonarr.svelte';
	import MMModal from '../MediaManager/MMModal.svelte';
	import ReleaseList from '../MediaManager/ReleaseList.svelte';
	import DownloadList from '../MediaManager/DownloadList.svelte';
	import FileList from '../MediaManager/FileList.svelte';
	import { log } from '../../utils';

	export let id: number; // Tmdb ID
	export let season: number;
	export let episode: number;
	export let modalId: symbol;
	export let hidden: boolean;

	const sonarrItem = sonarrApi.getSeriesByTmdbId(id);
	const downloads = sonarrItem.then((si) => sonarrApi.getDownloadsBySeriesId(si?.id || -1));
	const files = sonarrItem.then((si) => sonarrApi.getFilesBySeriesId(si?.id || -1));

	const sonarrEpisode = sonarrItem.then((si) =>
		sonarrApi
			.getEpisodes(si?.id || -1, season)
			.then(log)
			.then((episodes) => episodes.find((e) => e.episodeNumber === episode))
	);

	sonarrItem.then((si) => console.log('sonarrItem', si));
	sonarrEpisode.then((se) => console.log('sonarrEpisode', se));
	console.log(id, season, episode);

	const getReleases = () => sonarrEpisode.then((se) => sonarrApi.getEpisodeReleases(se?.id || -1));
	const selectRelease = () => {};

	const cancelDownload = sonarrApi.cancelDownloadSonarrEpisode;
	const handleSelectFile = () => {};
</script>

<MMModal {modalId} {hidden}>
	{#await sonarrEpisode then sonarrEpisode}
		{#if !sonarrEpisode}
			<MMAddToSonarr />
		{:else}
			<MMMainLayout>
				<h1 slot="title">{sonarrEpisode?.title}</h1>
				<h2 slot="subtitle">Season {season} Episode {episode}</h2>
				<ReleaseList slot="releases" {getReleases} {selectRelease} />
				<DownloadList slot="downloads" {downloads} {cancelDownload} />
				<FileList slot="local-files" {files} {handleSelectFile} />
			</MMMainLayout>
		{/if}
	{/await}
</MMModal>
