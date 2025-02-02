<script lang="ts">
	import ButtonGhost from '../../Ghosts/ButtonGhost.svelte';
	import type { Download, FileResource } from '../../../apis/combined-types';
	import MMLocalFileRow from './MMLocalFileRow.svelte';
	import TableHeaderRow from '../../Table/TableHeaderRow.svelte';
	import TableHeaderSortBy from '../../Table/TableHeaderSortBy.svelte';
	import TableHeaderCell from '../../Table/TableHeaderCell.svelte';
	import Container from '../../Container.svelte';
	import Button from '../../Button.svelte';
	import { Cross1, Trash } from 'radix-icons-svelte';
	import { scrollIntoView } from '../../../selectable';
	import type {
		CancelDownloadFn,
		CancelDownloadsFn,
		DeleteFileFn,
		DeleteFilesFn
	} from '../MediaManagerModal';
	import { modalStack } from '../../Modal/modal.store';
	import MMConfirmDeleteFileDialog from '../Dialogs/MMConfirmDeleteFileDialog.svelte';
	import MMDownloadRow from '../Downloads/MMDownloadRow.svelte';

	export let files: Promise<FileResource[]>;
	export let deleteFile: DeleteFileFn;
	export let deleteFiles: DeleteFilesFn;

	export let downloads: Promise<Download[]>;
	export let cancelDownload: CancelDownloadFn;
	export let cancelDownloads: CancelDownloadsFn;

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

	function confirmCancelAllDownloads(downloads: Download[]) {
		modalStack.create(MMConfirmDeleteFileDialog, {
			deleteFile: () => cancelDownloads(downloads.map((f) => f.id || -1))
		});
	}

	function confirmDeleteAllFiles(files: FileResource[]) {
		modalStack.create(MMConfirmDeleteFileDialog, {
			deleteFile: () => deleteFiles(files.map((f) => f.id || -1))
		});
	}
</script>

{#await downloads then downloads}
	{#if downloads?.length}
		<h1 class="text-lg font-semibold tracking-wide text-zinc-300 mb-4 mx-12">Downloads</h1>

		<div class="grid grid-cols-1 gap-4 mx-12 mb-4">
			{#each downloads as download}
				<MMDownloadRow {download} {cancelDownload} />
			{/each}
		</div>

		<Container
			direction="horizontal"
			class="flex mb-16 mx-12"
			on:enter={scrollIntoView({ vertical: 128 })}
		>
			<Button on:clickOrSelect={() => confirmCancelAllDownloads(downloads)}>
				Cancel All Downloads
				<Cross1 size={19} slot="icon" />
			</Button>
		</Container>

		<h1 class="text-2xl font-semibold mb-4 mt-8 mx-12">Local Files</h1>
	{/if}
{/await}

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
		<Container class="contents" focusedChild>
			{#each files as file}
				<MMLocalFileRow {file} {deleteFile} />
			{/each}
		</Container>
	</div>
	{#if files?.length}
		<Container
			direction="horizontal"
			class="flex mt-8 mx-12"
			on:enter={scrollIntoView({ vertical: 128 })}
		>
			<Button on:clickOrSelect={() => confirmDeleteAllFiles(files)}>
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
