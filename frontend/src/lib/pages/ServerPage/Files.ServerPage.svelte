<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Container from '$lib/components/Container.svelte';
	import ConfirmDialog from '$lib/components/Dialog/ConfirmDialog.svelte';
	import SelectDialog from '$lib/components/Dialog/SelectDialog.svelte';
	import { createModal } from '$lib/components/Modal/modal.store';
	import {
		createErrorNotification,
		createInfoNotification
	} from '$lib/components/Notifications/notification.store';
	import SelectField from '$lib/components/SelectField.svelte';
	import type { Selectable } from '$lib/selectable';
	import { reiverrApi } from '$lib/stores/user.store';
	import { formatSize, useInteractionObserver } from '$lib/utils';
	import classNames from 'classnames';
	import { ChevronDown, Reload, Trash } from 'radix-icons-svelte';
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

	$: rows = getRows(tree.roots, expanded, order);
	$: orderLabel = ORDERS.find((o) => o.value === order)?.label;
	$: partiallyChecked = getPartiallyChecked(checked);
	$: selection = getSelection(checked, tree.nodes);

	const errorMessage = (e: any): string => e?.response?.data?.message ?? e?.message ?? String(e);
	const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
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

	reiverrApi.localMedia
		.getLocalMediaSettings()
		.then(({ data }) => {
			folders = [...data.seriesFolders, ...data.movieFolders];

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
	<Container class="space-y-4">
		<SelectField
			value={folder || 'None'}
			disabled={!folders.length}
			class="max-w-md"
			on:clickOrSelect={selectFolder}
		>
			Library folder
			<ChevronDown slot="icon" let:size let:iconClass {size} class={classNames(iconClass)} />
		</SelectField>
		<Container direction="horizontal" class="flex items-center justify-between space-x-8">
			<Container direction="horizontal" class="flex items-center space-x-4">
				<Button iconAfter={ChevronDown} disabled={!folder} on:clickOrSelect={selectOrder}>
					Sort by {orderLabel}
				</Button>
				<Button icon={Reload} disabled={!folder || isScanning} on:clickOrSelect={confirmScan}>
					{isScanning ? 'Scanning...' : 'Scan library'}
				</Button>
			</Container>
			<Button icon={Trash} disabled={!checked.size} on:clickOrSelect={confirmDelete}>
				Delete {count(selection.files, 'file', 'files')}
				{#if checked.size}({formatSize(selection.size)}){/if}
			</Button>
		</Container>
	</Container>

	<!-- The list is mounted together with its first rows: rows that are added one by one to an
		empty list make it move the focus when rows are removed later. Sorting mounts it again, since
		the focus tree keeps the order the rows were mounted in -->
	{#if rows.length}
		{#key order}
			<Container
				class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide mt-6 pb-16"
				style="backface-visibility: hidden;"
			>
				{#each rows.slice(0, limit) as node (node.entry.path)}
					<FileRow
						{node}
						checked={isChecked(node, checked)}
						partiallyChecked={partiallyChecked.has(node.entry.path)}
						expanded={expanded.has(node.entry.path)}
						on:toggle={() => (checked = toggleChecked(node, checked))}
						on:expand={() => toggleExpanded(node.entry.path)}
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
