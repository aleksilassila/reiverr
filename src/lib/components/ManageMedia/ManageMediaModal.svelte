<script lang="ts">
	import FullScreenModal from '../Modal/FullScreenModal.svelte';
	import ManageMediaMenuLayout from './ManageMediaMenuLayout.svelte';
	import {
		type MovieFileResource,
		radarrApi,
		type RadarrRelease
	} from '../../apis/radarr/radarr-api';
	import ReleaseList from './Releases/ReleaseList.svelte';
	import FilesList from './LocalFiles/FilesList.svelte';
	import { modalStack } from '../Modal/modal.store';
	import FileActionsModal from './LocalFiles/FileActionsModal.svelte';
	import DownloadsList from './DownloadsList.svelte';
	import { useRequest } from '../../stores/data.store';
	import { derived, type Readable } from 'svelte/store';
	import ReleaseActionsModal from './Releases/ReleaseActionsModal.svelte';

	export let modalId: symbol;
	export let hidden: boolean;
	export let id: number;

	const { promise: files, refresh: refreshFiles } = useRequest(
		radarrApi.getMovieFilesByMovieId,
		id
	);
	const {
		promise: downloads,
		data: downloadsData,
		refresh: refreshDownloads
	} = useRequest(radarrApi.getRadarrDownloadsById, id);

	const handleGrabRelease = (guid: string, indexerId: number) =>
		radarrApi
			.downloadRadarrMovie(guid, indexerId)
			.then((ok) => {
				if (!ok) {
					// TODO: Show error
				}
				refreshFiles(id);

				return ok;
			})
			.finally(() => {
				radarrApi.getReleaseHistory(id).then(console.log);
				setTimeout(() => refreshDownloads(id), 8000);
			});
	const handleCancelDownload = (id: number) =>
		radarrApi.cancelDownloadRadarrMovie(id).then(() => refreshDownloads(id));

	const grabbedReleases: Readable<Record<string, boolean>> = derived(downloadsData, ($downloads) =>
		($downloads || []).reduce((acc: Record<string, boolean>, download) => {
			acc[`${download.title}`] = true;
			return acc;
		}, {})
	);

	function handleSelectRelease(release: RadarrRelease) {
		modalStack.create(
			ReleaseActionsModal,
			{
				release,
				grabRelease: handleGrabRelease
			},
			modalId
		);
	}

	function handleSelectFile(file: MovieFileResource) {
		modalStack.create(
			FileActionsModal,
			{
				file,
				handleDeleteFile: (id: number) =>
					radarrApi.deleteRadarrMovieFile(id).then(() => refreshFiles(id))
			},
			modalId
		);
	}
</script>

<FullScreenModal {modalId} {hidden}>
	<ManageMediaMenuLayout>
		<h1 slot="header">Download</h1>
		<ReleaseList {id} getReleases={radarrApi.getReleases} selectRelease={handleSelectRelease} />
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
