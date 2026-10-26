<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { LibraryFolderDto, LibrarySettingsDto } from '$lib/apis/reiverr/reiverr.openapi';
	import { libraryQueries, updateLibrarySettings } from '$lib/queries/library.queries';
	import { usePageQuery } from '$lib/queries/page-query';
	import { scrollIntoView } from '$lib/selectable';
	import classNames from 'classnames';
	import { Check, ChevronRight, Plus } from 'radix-icons-svelte';
	import Button from '../../components/Button/Button.svelte';
	import FolderPickerDialog from '../../components/Dialog/FolderPickerDialog.svelte';
	import { createModal } from '../../components/Modal/modal.store';
	import SelectButtonGroup from '../../components/SelectButtonGroup.svelte';
	import SelectField from '../../components/SelectField.svelte';
	import TextField from '../../components/TextField.svelte';
	import LibraryFolderDialog from './LibraryFolderDialog.SettingsPage.svelte';

	type FolderKey = 'movieFolders' | 'seriesFolders';
	type FolderGroup = { key: FolderKey; name: string; label: string; add: string };

	const groups: FolderGroup[] = [
		{
			key: 'seriesFolders',
			name: 'Series folders',
			label: 'Series folder',
			add: 'Add Series Folder'
		},
		{ key: 'movieFolders', name: 'Movie folders', label: 'Movie folder', add: 'Add Movie Folder' }
	];

	const settingsQuery = usePageQuery(libraryQueries.settings());

	let cleanupError = '';
	/** What is typed into the disk limit field, until it is saved */
	let diskLimitInput: string | undefined;
	let diskLimitError = '';

	$: settings = $settingsQuery.data;
	$: savedDiskLimit =
		settings?.maxDiskUsagePercent === null || settings?.maxDiskUsagePercent === undefined
			? ''
			: String(settings.maxDiskUsagePercent);
	$: diskLimit = diskLimitInput ?? savedDiskLimit;

	const cleanupOptions: { label: string; value: LibrarySettingsDto['cleanup'] }[] = [
		{ label: 'Off', value: 'off' },
		{ label: 'Every day', value: 'daily' },
		{ label: 'Every Monday', value: 'weekly' },
		{ label: 'First of the month', value: 'monthly' }
	];

	/** Saves the folders of a type; the dialogs show what it rejects with */
	function saveFolders(
		current: LibrarySettingsDto,
		key: FolderKey,
		folders: Record<string, LibraryFolderDto>,
		force = false
	) {
		return updateLibrarySettings({ ...current, [key]: folders }, force);
	}

	function makePrimary(current: LibrarySettingsDto, key: FolderKey, primary: string) {
		const folders: Record<string, LibraryFolderDto> = {};
		for (const path of Object.keys(current[key])) {
			folders[path] = { primary: path === primary };
		}
		return saveFolders(current, key, folders);
	}

	/** The folders without the one removed; the first of the rest takes over as primary */
	function removeFolder(
		current: LibrarySettingsDto,
		key: FolderKey,
		removed: string,
		force: boolean
	) {
		const rest = Object.keys(current[key]).filter((path) => path !== removed);
		const primary = rest.find((path) => current[key][path]?.primary) ?? rest[0];
		const folders: Record<string, LibraryFolderDto> = {};
		for (const path of rest) {
			folders[path] = { primary: path === primary };
		}
		return saveFolders(current, key, folders, force);
	}

	function openFolder(group: FolderGroup, path: string) {
		const current = settings;
		if (!current) return;

		createModal(LibraryFolderDialog, {
			path,
			label: group.label,
			isPrimary: !!current[group.key][path]?.primary,
			onMakePrimary: () => makePrimary(current, group.key, path),
			onRemove: (force: boolean) => removeFolder(current, group.key, path, force)
		});
	}

	/** Opens the picker; a folder of either type cannot be picked again */
	function addFolder(group: FolderGroup) {
		const current = settings;
		if (!current) return;

		const disabled: Record<string, string> = {};
		for (const other of groups) {
			for (const path of Object.keys(current[other.key])) disabled[path] = other.label;
		}
		createModal(FolderPickerDialog, {
			title: `Add a ${group.label.toLowerCase()}`,
			disabled,
			onSelect: (folder: string) =>
				saveFolders(current, group.key, {
					...current[group.key],
					[folder]: { primary: !Object.keys(current[group.key]).length }
				})
		});
	}

	async function saveCleanup(value: string) {
		if (!settings) return;
		cleanupError = '';

		await updateLibrarySettings({
			...settings,
			cleanup: value as LibrarySettingsDto['cleanup']
		}).catch((e) => (cleanupError = e?.response?.data?.message ?? e?.message));
	}

	async function saveDiskLimit() {
		if (!settings) return;
		diskLimitError = '';

		await updateLibrarySettings({
			...settings,
			maxDiskUsagePercent: diskLimit === '' ? null : Number(diskLimit)
		})
			.then(() => (diskLimitInput = undefined))
			.catch((e) => (diskLimitError = e?.response?.data?.message ?? e?.message));
	}
</script>

<Container>
	<div class="mb-8">
		<h1 class="h3 mb-1">Library</h1>
		<p class="body">
			Downloaded episodes are imported into the library folders, new titles into the primary one.
			Files that no request keeps are deleted at the cleanup. Once a disk is at the disk limit,
			nothing more is downloaded for anyone until there is room again.
		</p>
	</div>
	{#if settings}
		{#each groups as group}
			{@const paths = Object.keys(settings[group.key])}
			<div class="max-w-sm mb-8">
				<h2 class="font-semibold text-sm text-secondary-400 mb-2">{group.name}</h2>
				{#if paths.length}
					<!-- The primary folder is checked; a row opens the settings of its folder -->
					<Container class="flex flex-col space-y-4 mb-4">
						{#each paths as path (path)}
							<SelectField
								on:enter={scrollIntoView({ vertical: 128 })}
								on:clickOrSelect={() => openFolder(group, path)}
							>
								<div slot="content" class="flex items-center">
									{#if settings[group.key][path]?.primary}
										<Check size={24} class="flex-shrink-0 mr-2" />
									{/if}
									<span class="line-clamp-1 break-all">{path}</span>
								</div>
								<ChevronRight
									slot="icon"
									let:size
									let:iconClass
									{size}
									class={classNames(iconClass)}
								/>
							</SelectField>
						{/each}
					</Container>
				{:else}
					<p class="text-secondary-400 mb-4">None</p>
				{/if}
				<Button
					icon={Plus}
					on:enter={scrollIntoView({ vertical: 128 })}
					on:clickOrSelect={() => addFolder(group)}
				>
					{group.add}
				</Button>
			</div>
		{/each}

		<div class="max-w-sm">
			<SelectButtonGroup
				name="Garbage collect files no one wants (at 4:00)"
				options={cleanupOptions}
				selected={settings.cleanup}
				on:enter={scrollIntoView({ vertical: 128 })}
				on:select={({ detail }) => saveCleanup(detail)}
			/>
			{#if cleanupError}
				<p class="error mt-4">{cleanupError}</p>
			{/if}
		</div>

		<Container class="flex flex-col space-y-4 mt-8 max-w-sm">
			<TextField
				type="number"
				value={diskLimit}
				placeholder="No limit"
				on:enter={scrollIntoView({ vertical: 128 })}
				on:change={({ detail }) => (diskLimitInput = detail)}
			>
				Disk limit (percent of a disk in use, empty for no limit)
			</TextField>
			{#if diskLimitError}
				<p class="error">{diskLimitError}</p>
			{/if}
		</Container>
		<Button
			class="mt-4"
			disabled={diskLimit === savedDiskLimit}
			action={saveDiskLimit}
			on:enter={scrollIntoView({ vertical: 128 })}
		>
			Save Disk Limit
		</Button>
	{/if}
</Container>
