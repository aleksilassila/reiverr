<script lang="ts">
	import type { LibraryFolderDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Button from '$lib/components/Button/Button.svelte';
	import Scrollable from '$lib/components/Carousel/Scrollable.svelte';
	import Container from '$lib/components/Container.svelte';
	import ConfirmDialog from '$lib/components/Dialog/ConfirmDialog.svelte';
	import SelectDialog from '$lib/components/Dialog/SelectDialog.svelte';
	import { createModal } from '$lib/components/Modal/modal.store';
	import {
		createErrorNotification,
		createInfoNotification
	} from '$lib/components/Notifications/notification.store';
	import SelectField from '$lib/components/SelectField.svelte';
	import { scrollIntoView, type Selectable } from '$lib/selectable';
	import { reiverrApi } from '$lib/stores/user.store';
	import { formatSize, useInteractionObserver } from '$lib/utils';
	import classNames from 'classnames';
	import { Archive, Bookmark, ChevronDown, Cross2, Reload, Trash } from 'radix-icons-svelte';
	import { tick } from 'svelte';
	import FileRow from './FileRow.ServerPage.svelte';
	import {
		buildTree,
		getPartiallyChecked,
		getRows,
		getSelection,
		isChecked,
		toggleChecked,
		type LibraryNode,
		type LibraryOrder,
		type LibraryTree
	} from './library-tree';

	// How many rows are added when the end of the rendered ones comes close
	const ROWS = 100;
	const ORDERS: { value: LibraryOrder; label: string }[] = [
		{ value: 'size', label: 'Size' },
		{ value: 'name', label: 'Name' }
	];

	let folders: string[] = [];
	let seriesFolders: string[] = [];
	let folder = '';
	let tree: LibraryTree = { roots: [], nodes: new Map() };
	let expanded = new Set<string>();
	let checked = new Set<string>();
	let order: LibraryOrder = 'size';
	let limit = ROWS;
	let isLoading = true;
	let isScanning = false;
	let error = '';
	let loads = 0;
	// What the cleanup would delete now, library-wide as the button runs it
	let unretained = 0;
	let header: Selectable | undefined;

	$: rows = getRows(tree.roots, expanded, order);
	$: orderLabel = ORDERS.find((o) => o.value === order)?.label;
	$: partiallyChecked = getPartiallyChecked(checked);
	$: selection = getSelection(checked, tree.nodes);
	// Managing files and requesting them is built for series
	$: isSeriesFolder = seriesFolders.includes(folder);

	const errorMessage = (e: any): string => e?.response?.data?.message ?? e?.message ?? String(e);
	const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
	// The primary folder first, as the server orders them
	const folderPaths = (folders: Record<string, LibraryFolderDto>) => [
		...Object.keys(folders).filter((path) => folders[path]?.primary),
		...Object.keys(folders).filter((path) => !folders[path]?.primary)
	];
	const observer = useInteractionObserver(() => (limit += ROWS));

	/** Directories stay expanded when the folder they are in is loaded again */
	async function load(next: string) {
		const id = ++loads;
		const isSameFolder = next === folder;

		folder = next;
		isLoading = true;
		error = '';
		checked = new Set();
		if (!isSameFolder) {
			tree = { roots: [], nodes: new Map() };
			expanded = new Set();
			limit = ROWS;
		}

		const result = await reiverrApi.server
			.getLibraryEntries({ folder })
			.then((r) => buildTree(r.data))
			.catch((e) => errorMessage(e));
		// Another folder was selected in the meantime
		if (id !== loads) return;

		if (typeof result === 'string') error = result;
		else tree = result;
		isLoading = false;

		reiverrApi.server
			.previewCleanup()
			.then((r) => (unretained = r.data.files))
			.catch(() => (unretained = 0));
	}

	function selectFolder() {
		createModal(SelectDialog, {
			title: 'Library folder',
			options: folders,
			selectedOption: folder,
			handleSelectOption: load
		});
	}

	function selectOrder() {
		createModal(SelectDialog, {
			title: 'Sort by',
			options: ORDERS.map((o) => o.label),
			selectedOption: orderLabel,
			handleSelectOption: (label) => (order = ORDERS.find((o) => o.label === label)?.value ?? order)
		});
	}

	/** Collapsing a directory collapses everything in it */
	function toggleExpanded(path: string) {
		if (expanded.delete(path)) {
			expanded.forEach((p) => {
				if (p.startsWith(`${path}/`)) expanded.delete(p);
			});
		} else expanded.add(path);
		expanded = expanded;
	}

	/** Opens a directory and moves on to its first entry; opening it again closes it */
	async function expand(node: LibraryNode, row: Selectable) {
		const opens = !expanded.has(node.entry.path);
		toggleExpanded(node.entry.path);
		if (!opens || !node.children.length) return;

		await tick();
		row.getSibling(1)?.focus();
	}

	/** Closes the directory of the row, or the one the row is in, which then takes the focus */
	function collapse(node: LibraryNode, row: Selectable) {
		if (expanded.has(node.entry.path)) return toggleExpanded(node.entry.path);
		if (!node.parent) return;

		row.getSibling(rows.indexOf(node.parent) - rows.indexOf(node))?.focus();
		toggleExpanded(node.parent.entry.path);
	}

	function confirmDelete() {
		const { files, directories, size, heldFiles, requests } = selection;
		const what = [
			files ? count(files, 'file', 'files') : '',
			directories ? count(directories, 'folder', 'folders') : ''
		].filter(Boolean);

		createModal(ConfirmDialog, {
			header: 'Delete from disk?',
			body:
				`${what.join(' and ')} (${formatSize(size)}) will be deleted for good.` +
				(heldFiles
					? ` ${count(heldFiles, 'file is', 'files are')} held by ${count(requests, 'request', 'requests')}, which will be deleted too.`
					: ''),
			confirm: () =>
				reiverrApi.server
					.deleteLibraryEntries({ folder, paths: Array.from(checked) })
					.then(({ data }) => {
						if (data.failed.length) {
							createErrorNotification(
								`Could not delete ${count(data.failed.length, 'entry', 'entries')}`,
								data.failed.map((f) => `${f.path}: ${f.error}`).join('\n')
							);
						}
					})
					.catch((e) => createErrorNotification('Could not delete', errorMessage(e)))
					.then(() => load(folder))
		});
	}

	/** The requests keep the files as long as the admin's rules keep the requests, so it asks first */
	function confirmRequest() {
		const files = count(selection.indexedFiles, 'file', 'files');

		createModal(ConfirmDialog, {
			header: 'Request the files?',
			body: `The episodes of ${files} will be requested for you, bound to the files, so that they are kept as long as your requests keep them under your request rules. Of several files of one episode, one gets the request. Automatic request rules apply.`,
			confirm: () =>
				reiverrApi.server
					.requestLibraryEntries({ folder, paths: Array.from(checked) })
					.then(({ data }) => {
						const what = [
							`${count(data.requests, 'request', 'requests')} bound`,
							data.skipped ? `${count(data.skipped, 'file', 'files')} skipped` : ''
						].filter(Boolean);
						createInfoNotification('Requested', what.join(', '));
					})
					.catch((e) => createErrorNotification('Could not request', errorMessage(e)))
					.then(() => load(folder))
		});
	}

	/** The nightly cleanup, now: it asks with what a dry run of it would delete */
	async function confirmCleanup() {
		const preview = await reiverrApi.server
			.previewCleanup()
			.then((r) => r.data)
			.catch((e) => {
				createErrorNotification('Could not preview the cleanup', errorMessage(e));
				return undefined;
			});
		if (!preview) return;
		if (!preview.files) {
			return createInfoNotification('Nothing to delete', 'A request holds every managed file.');
		}

		createModal(ConfirmDialog, {
			header: 'Delete unretained files now?',
			body: `${count(preview.files, 'managed file', 'managed files')} (${formatSize(preview.size)}) that no request holds will be deleted immediately.`,
			confirm: () =>
				reiverrApi.server
					.runCleanup()
					.then(({ data }) =>
						createInfoNotification(
							'Cleanup queued',
							`${count(data.files, 'file', 'files')} (${formatSize(data.size)}) to delete`
						)
					)
					.catch((e) => createErrorNotification('Could not start the cleanup', errorMessage(e)))
		});
	}

	/** A managed file that nothing holds goes at the next cleanup, so it asks first */
	function confirmManage() {
		const files = count(selection.indexedFiles - selection.managedFiles, 'file', 'files');

		createModal(ConfirmDialog, {
			header: 'Manage the files?',
			body: `${files} will be managed. A managed file that no request holds is deleted at the next cleanup. Until then a request can be bound to it from the sources of its episode, or with Request here.`,
			confirm: () => setManaged(true)
		});
	}

	function setManaged(managed: boolean) {
		const paths = Array.from(checked);

		return (
			managed
				? reiverrApi.server.manageLibraryEntries({ folder, paths })
				: reiverrApi.server.unmanageLibraryEntries({ folder, paths })
		)
			.then(({ data }) =>
				createInfoNotification(
					managed ? 'Managed' : 'Unmanaged',
					`${count(data.files, 'file', 'files')} changed`
				)
			)
			.catch((e) =>
				createErrorNotification(
					managed ? 'Could not manage' : 'Could not unmanage',
					errorMessage(e)
				)
			)
			.then(() => load(folder));
	}

	/** Warns when the scan would forget indexed files, which happens to all of them in a folder that is not mounted */
	async function confirmScan() {
		const preview = await reiverrApi.server
			.previewLibraryScan({ folder })
			.then((r) => r.data)
			.catch((e) => {
				createErrorNotification('Could not scan', errorMessage(e));
				return undefined;
			});
		if (!preview) return;
		if (preview.available && !preview.missing) return scan(false);

		const files = count(preview.missing, 'indexed file is', 'indexed files are');
		createModal(ConfirmDialog, {
			header: 'Scan the folder?',
			body:
				(preview.available ? `${files} not on disk.` : `${preview.reason}. ${files} not on disk.`) +
				` ${preview.missing === 1 ? 'It' : 'They'} will be removed from the index` +
				(preview.requests
					? `, and the ${count(preview.requests, 'request', 'requests')} that ${preview.requests === 1 ? 'holds' : 'hold'} them will download them again.`
					: '.'),
			// A folder that reads as mounted is not forced, in case it is not anymore
			confirm: () => scan(!preview.available)
		});
	}

	async function scan(force: boolean) {
		isScanning = true;
		await reiverrApi.server
			.scanLibrary({ folder, force })
			.then(({ data }) => {
				const what = [
					`${data.added} added`,
					`${data.updated} updated`,
					`${data.forgotten} forgotten`,
					data.unresolved.length
						? `${count(data.unresolved.length, 'folder', 'folders')} not recognised`
						: ''
				].filter(Boolean);
				createInfoNotification('Scanned', what.join(', '));
				if (data.failed.length) {
					createErrorNotification(
						`Could not read ${count(data.failed.length, 'entry', 'entries')}`,
						data.failed.map((f) => `${f.path}: ${f.error}`).join('\n')
					);
				}
			})
			.catch((e) => createErrorNotification('Could not scan', errorMessage(e)));
		isScanning = false;
		await load(folder);
	}

	reiverrApi.library
		.getLibrarySettings()
		.then(({ data }) => {
			folders = [...folderPaths(data.seriesFolders), ...folderPaths(data.movieFolders)];
			seriesFolders = folderPaths(data.seriesFolders);

			const first = folders[0];
			if (first) return load(first);
			isLoading = false;
		})
		.catch((e) => {
			error = errorMessage(e);
			isLoading = false;
		});
</script>

<Container class="h-full flex flex-col">
	<Container class="space-y-4" bind:selectable={header}>
		<SelectField
			value={folder || 'None'}
			disabled={!folders.length}
			class="max-w-md"
			on:clickOrSelect={selectFolder}
		>
			Library folder
			<ChevronDown slot="icon" let:size let:iconClass {size} class={classNames(iconClass)} />
		</SelectField>
		<Scrollable class="flex items-center justify-between space-x-8" fadeWidth={3}>
			<Container direction="horizontal" class="flex-shrink-0 flex items-center space-x-4">
				<Button
					iconAfter={ChevronDown}
					disabled={!folder}
					on:clickOrSelect={selectOrder}
					on:enter={scrollIntoView({ horizontal: 64 })}
				>
					Sort by {orderLabel}
				</Button>
				<Button
					icon={Reload}
					disabled={!folder || isScanning}
					on:clickOrSelect={confirmScan}
					on:enter={scrollIntoView({ horizontal: 64 })}
				>
					{isScanning ? 'Scanning...' : 'Scan library'}
				</Button>
				<Button
					icon={Trash}
					disabled={!folders.length}
					on:clickOrSelect={confirmCleanup}
					on:enter={scrollIntoView({ horizontal: 64 })}
				>
					Delete unretained{unretained ? ` (${unretained})` : ''}
				</Button>
			</Container>
			<Container direction="horizontal" class="flex-shrink-0 flex items-center space-x-4">
				<Button
					icon={Bookmark}
					disabled={!isSeriesFolder || !selection.indexedFiles}
					on:clickOrSelect={confirmRequest}
					on:enter={scrollIntoView({ horizontal: 64 })}
				>
					Request
				</Button>
				<Button
					icon={Archive}
					disabled={!isSeriesFolder || selection.indexedFiles === selection.managedFiles}
					on:clickOrSelect={confirmManage}
					on:enter={scrollIntoView({ horizontal: 64 })}
				>
					Set managed
				</Button>
				<Button
					icon={Cross2}
					disabled={!selection.managedFiles}
					action={() => setManaged(false)}
					on:enter={scrollIntoView({ horizontal: 64 })}
				>
					Set external
				</Button>
				<Button
					icon={Trash}
					disabled={!checked.size}
					on:clickOrSelect={confirmDelete}
					on:enter={scrollIntoView({ horizontal: 64 })}
				>
					Delete {count(selection.files, 'file', 'files')}
					{#if checked.size}({formatSize(selection.size)}){/if}
				</Button>
			</Container>
		</Scrollable>
	</Container>

	<!-- The list is mounted together with its first rows: rows that are added one by one to an
		empty list make it move the focus when rows are removed later. Sorting mounts it again, since
		the focus tree keeps the order the rows were mounted in -->
	{#if rows.length}
		{#key order}
			<!-- Back goes up to the buttons instead of leaving the page, a long way on a remote -->
			<Container
				class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide mt-6 pb-16"
				style="backface-visibility: hidden;"
				on:back={({ detail }) => {
					header?.focus();
					detail.stopPropagation();
				}}
			>
				{#each rows.slice(0, limit) as node (node.entry.path)}
					<FileRow
						{node}
						checked={isChecked(node, checked)}
						partiallyChecked={partiallyChecked.has(node.entry.path)}
						expanded={expanded.has(node.entry.path)}
						cleanup={isSeriesFolder}
						on:toggle={() => (checked = toggleChecked(node, checked))}
						on:expand={({ detail }) => expand(node, detail)}
						on:collapse={({ detail }) => collapse(node, detail)}
					/>
				{/each}
				{#if rows.length > limit}
					<!-- Reaches up from the end of the rows, so that more are there before the last one is -->
					{#key limit}
						<div class="relative">
							<div use:observer class="absolute bottom-0 w-px h-[50rem] pointer-events-none" />
						</div>
					{/key}
				{/if}
			</Container>
		{/key}
	{:else}
		<div class={classNames('h-ghost mt-14', { error: !!error })}>
			{#if error}
				{error}
			{:else if isLoading}
				Loading...
			{:else if !folders.length}
				No library folders are configured.
			{:else}
				The folder is empty.
			{/if}
		</div>
	{/if}
</Container>
