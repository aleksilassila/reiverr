<script lang="ts">
	import FullScreenModal from '../Modal/FullScreenModal.svelte';
	import ManageMediaMenuLayout from './ManageMediaMenuLayout.svelte';
	import { radarrApi } from '../../apis/radarr/radarr-api';
	import FilesList from './LocalFiles/FilesList.svelte';
	import { modalStack } from '../Modal/modal.store';
	import FileActionsModal from './LocalFiles/FileActionsModal.svelte';
	import DownloadsList from './DownloadsList.svelte';
	import { useRequest } from '../../stores/data.store';
	import { derived, type Readable } from 'svelte/store';
	import SeasonList from './SeasonList.svelte';
	import { sonarrApi } from '../../apis/sonarr/sonarr-api';
	import SeasonReleasesModal from './Releases/SeasonReleasesModal.svelte';
	import type { FileResource, Release } from '../../apis/combined-types';
	import ReleaseActionsModal from './Releases/ReleaseActionsModal.svelte';
	import Button from '../Button.svelte';

	export let modalId: symbol;
	export let groupId: symbol;
	export let hidden: boolean;
	export let id: number;

	const { promise: files, refresh: refreshFiles } = useRequest(sonarrApi.getFilesBySeriesId, id);
	const {
		promise: downloads,
		data: downloadsData,
		refresh: refreshDownloads
	} = useRequest(sonarrApi.getSonarrDownloadsById, id);

	const handleGrabRelease = (guid: string, indexerId: number) =>
		sonarrApi
			.downloadSonarrEpisode(guid, indexerId)
			.then((ok) => {
				if (!ok) {
					// TODO: Show error
				}
				refreshFiles(id);

				return ok;
			})
			.finally(() => {
				setTimeout(() => refreshDownloads(id), 8000);
			});
	const handleCancelDownload = (id: number) =>
		sonarrApi.cancelDownloadSonarrEpisode(id).then(() => refreshDownloads(id));

	const grabbedReleases: Readable<Record<string, boolean>> = derived(downloadsData, ($downloads) =>
		($downloads || []).reduce((acc: Record<string, boolean>, download) => {
			acc[`${download.title}`] = true;
			return acc;
		}, {})
	);

	function handleSelectSeason(seasonNumber: number) {
		modalStack.create(
			SeasonReleasesModal,
			{
				seriesId: id,
				seasonNumber,
				grabRelease: handleGrabRelease
			},
			groupId
		);
	}

	const handleSelectRelease = (release: Release) => {
		modalStack.create(
			ReleaseActionsModal,
			{
				release,
				grabRelease: handleGrabRelease,
				status: undefined
			},
			groupId
		);
	};

	function handleSelectFile(file: FileResource) {
		modalStack.create(
			FileActionsModal,
			{
				file,
				handleDeleteFile: (id: number) =>
					sonarrApi.deleteSonarrEpisode(id).then(() => refreshFiles(id))
			},
			groupId
		);
	}
</script>

<FullScreenModal {modalId} {hidden}>
	<ManageMediaMenuLayout focusOnMount>
		<h1 slot="header">Download</h1>
		<SeasonList {id} selectSeason={handleSelectSeason} />
	</ManageMediaMenuLayout>
	<ManageMediaMenuLayout>
		<h1 slot="header">Local Files</h1>
		<FilesList files={$files} {handleSelectFile} />
	</ManageMediaMenuLayout>
	<ManageMediaMenuLayout>
		<h1 slot="header">Downloads</h1>
		<DownloadsList downloads={$downloads} cancelDownload={handleCancelDownload} />
	</ManageMediaMenuLayout>
</FullScreenModal>
