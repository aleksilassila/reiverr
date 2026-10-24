<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { LibrarySettingsDto } from '$lib/apis/reiverr/reiverr.openapi';
	import { scrollIntoView } from '$lib/selectable';
	import Button from '../../components/Button/Button.svelte';
	import SelectButtonGroup from '../../components/SelectButtonGroup.svelte';
	import TextField from '../../components/TextField.svelte';
	import { reiverrApi } from '../../stores/user.store';

	let settings: LibrarySettingsDto | undefined = undefined;
	let cleanupError = '';
	let diskLimit = '';
	let savedDiskLimit = '';
	let diskLimitError = '';

	const cleanupOptions: { label: string; value: LibrarySettingsDto['cleanup'] }[] = [
		{ label: 'Off', value: 'off' },
		{ label: 'Every day', value: 'daily' },
		{ label: 'Every Monday', value: 'weekly' },
		{ label: 'First of the month', value: 'monthly' }
	];

	reiverrApi.library.getLibrarySettings().then((r) => setSettings(r.data));

	function setSettings(value: LibrarySettingsDto) {
		settings = value;
		diskLimit = savedDiskLimit =
			value.maxDiskUsagePercent === null ? '' : String(value.maxDiskUsagePercent);
	}

	async function saveCleanup(value: string) {
		if (!settings) return;
		cleanupError = '';

		await reiverrApi.library
			.updateLibrarySettings({ ...settings, cleanup: value as LibrarySettingsDto['cleanup'] })
			.then((r) => setSettings(r.data))
			.catch((e) => (cleanupError = e?.response?.data?.message ?? e?.message));
	}

	async function saveDiskLimit() {
		if (!settings) return;
		diskLimitError = '';

		await reiverrApi.library
			.updateLibrarySettings({
				...settings,
				maxDiskUsagePercent: diskLimit === '' ? null : Number(diskLimit)
			})
			.then((r) => setSettings(r.data))
			.catch((e) => (diskLimitError = e?.response?.data?.message ?? e?.message));
	}
</script>

<Container>
	<div class="mb-8">
		<h1 class="h3 mb-1">Library</h1>
		<p class="body">
			Downloaded episodes are imported into the library folders. Files that no request keeps are
			deleted at the cleanup. Once a disk is at the disk limit, nothing more is downloaded for
			anyone until there is room again.
		</p>
	</div>
	{#if settings}
		<div class="max-w-sm">
			<SelectButtonGroup
				name="Delete downloaded files that no request keeps (at 4:00)"
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
				on:change={({ detail }) => (diskLimit = detail)}
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
