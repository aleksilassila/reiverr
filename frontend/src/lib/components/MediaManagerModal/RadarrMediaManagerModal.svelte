<script lang="ts">
	// import MMAddToSonarr from './MMAddToSonarr.svelte';
	import { radarrApi, type RadarrMovie } from '../../apis/radarr/radarr-api';
	import type { GrabReleaseFn } from './MediaManagerModal';
	import type { Release } from '../../apis/combined-types';
	import Dialog from '../Dialog/Dialog.svelte';
	import MMReleasesTab from './Releases/MMReleasesTab.svelte';
	import { retry } from '../../utils';

	export let radarrItem: RadarrMovie;
	export let onGrabRelease: (release: Release) => void = () => {};

	export let modalId: symbol;
	export let hidden: boolean;

	$: releases = retry(
		() => radarrApi.getReleases(radarrItem.id || -1),
		(v) => !!v?.length,
		{ retries: 2 }
	);

	const grabRelease: GrabReleaseFn = (release) =>
		radarrApi.downloadMovie(release.guid || '', release.indexerId || -1).then((r) => {
			onGrabRelease(release);
			return r;
		});
</script>

<Dialog size="full" {modalId} {hidden}>
	<MMReleasesTab {releases} {grabRelease}>
		<h1 slot="title">{radarrItem?.title}</h1>
		<h2 slot="subtitle">
			Releases
			<!--{#if season}-->
			<!--	Season {season} Releases-->
			<!--{:else if 'episodeNumber' in sonarrItem}-->
			<!--	Episode {sonarrItem.episodeNumber} Releases-->
			<!--{/if}-->
		</h2>
	</MMReleasesTab>
</Dialog>

<!--<MMModal {modalId} {hidden}>-->
<!--	{#await radarrItem then movie}-->
<!--		{#if !movie}-->
<!--			&lt;!&ndash;			<MMAddToSonarr />&ndash;&gt;-->
<!--		{:else}-->
<!--			<MMMainLayout>-->
<!--				<h1 slot="title">{movie?.title}</h1>-->
<!--				<ReleaseList slot="releases" {getReleases} {selectRelease} />-->
<!--				<DownloadList slot="downloads" {downloads} {cancelDownload} />-->
<!--				<FileList slot="local-files" {files} {handleSelectFile} />-->
<!--			</MMMainLayout>-->
<!--		{/if}-->
<!--	{/await}-->
<!--</MMModal>-->
