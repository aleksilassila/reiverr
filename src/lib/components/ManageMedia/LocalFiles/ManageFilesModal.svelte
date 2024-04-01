<script lang="ts">
	import FullScreenModal from '../FullScreenModal.svelte';
	import FullScreenModalContainer from '../FullScreenModalContainer.svelte';
	import Container from '../../../../Container.svelte';
	import FilesList from './FilesList.svelte';
	import { type MovieFileResource, radarrApi } from '../../../apis/radarr/radarr-api';
	import FileActionsList from './FileActionsList.svelte';
	import { formatSize } from '../../../utils';

	export let id: number;
	export let modalId: symbol;

	let selectedFile: MovieFileResource | undefined = undefined;

	function handleSelectFile(file: MovieFileResource) {
		selectedFile = file;
	}
</script>

<FullScreenModal {modalId}>
	{#if !selectedFile}
		<FullScreenModalContainer>
			<h1 slot="header">Local Files</h1>
			<Container>
				<FilesList getFiles={radarrApi.getMovieFilesByMovieId} {handleSelectFile} {id} />
			</Container>
		</FullScreenModalContainer>
	{:else}
		<FullScreenModalContainer>
			<div slot="header" class="flex">
				<h1 class="line-clamp-1 flex-1 mr-4">
					{selectedFile.relativePath}
				</h1>
				<h1 class="text-zinc-300">{formatSize(selectedFile.size || 0)}</h1>
			</div>
			<Container>
				<FileActionsList file={selectedFile} handleDeleteFile={radarrApi.deleteRadarrMovieFile} />
			</Container>
		</FullScreenModalContainer>
	{/if}
</FullScreenModal>
