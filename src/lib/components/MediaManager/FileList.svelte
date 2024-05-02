<script lang="ts">
	import ButtonGhost from '../Ghosts/ButtonGhost.svelte';
	import type { FileResource } from '../../apis/combined-types';
	import Table from '../Table/Table.svelte';
	import MMLocalFileRow from '../MediaManagerModal/MMLocalFileRow.svelte';
	import TableHeaderRow from '../Table/TableHeaderRow.svelte';
	import TableHeaderSortBy from '../Table/TableHeaderSortBy.svelte';
	import TableHeaderCell from '../Table/TableHeaderCell.svelte';
	import Container from '../../../Container.svelte';
	import Button from '../Button.svelte';
	import { Trash } from 'radix-icons-svelte';
	import { scrollIntoView } from '../../selectable';
	import type { DeleteFile } from '../MediaManagerModal/MediaManagerModal';
	import { modalStack } from '../Modal/modal.store';
	import MMConfirmDeleteFileDialog from '../MediaManagerModal/Dialogs/MMConfirmDeleteFileDialog.svelte';
	import { sonarrApi } from '../../apis/sonarr/sonarr-api';

	export let files: Promise<FileResource[]>;
	export let deleteFile: DeleteFile;
	// export let handleSelectFile: (file: FileResource) => void;

	let sortBy: 'size' | 'quality' | 'title' | 'runtime' | undefined = 'title';
	let sortDirection: 'asc' | 'desc' = 'desc';

	const toggleSortBy = (sort: typeof sortBy) => () => {
		if (sortBy === sort) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = sort;
			sortDirection = 'desc';
		}
	};
</script>

{#await files}
	{#each new Array(5) as _, index}
		<div class="flex-1 my-2">
			<ButtonGhost />
		</div>
	{/each}
{:then files}
	<div class="grid grid-cols-[1fr_max-content_max-content_max-content_max-content] gap-y-4">
		<TableHeaderRow>
			<TableHeaderSortBy
				icon={sortBy === 'title' ? sortDirection : undefined}
				on:clickOrSelect={toggleSortBy('title')}>Title</TableHeaderSortBy
			>
			<TableHeaderSortBy
				icon={sortBy === 'runtime' ? sortDirection : undefined}
				on:clickOrSelect={toggleSortBy('runtime')}>Runtime</TableHeaderSortBy
			>
			<TableHeaderSortBy
				icon={sortBy === 'size' ? sortDirection : undefined}
				on:clickOrSelect={toggleSortBy('size')}>Size</TableHeaderSortBy
			>
			<TableHeaderSortBy
				icon={sortBy === 'quality' ? sortDirection : undefined}
				on:clickOrSelect={toggleSortBy('quality')}>Quality</TableHeaderSortBy
			>
			<TableHeaderCell />
		</TableHeaderRow>
		{#each files as file}
			<MMLocalFileRow {file} {deleteFile} />
		{/each}
	</div>
	{#if files?.length}
		<Container
			direction="horizontal"
			class="flex mt-8 mx-12"
			on:enter={scrollIntoView({ vertical: 128 })}
		>
			<Button
				on:clickOrSelect={() =>
					modalStack.create(MMConfirmDeleteFileDialog, {
						deleteFile: () => sonarrApi.deleteSonarrEpisodes(files.map((f) => f.id || -1))
					})}
			>
				Delete all
				<Trash size={19} slot="icon" />
			</Button>
		</Container>
	{:else}
		<div class="text-zinc-400 font-medium mx-12 flex flex-col items-center justify-center h-full">
			<h1 class="text-xl text-zinc-300">No local files found</h1>
			<div>Your local files will appear here.</div>
		</div>
	{/if}
{/await}
