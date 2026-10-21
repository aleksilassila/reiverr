<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { LibrarySettingsDto } from '$lib/apis/reiverr/reiverr.openapi';
	import { scrollIntoView } from '$lib/selectable';
	import SelectButtonGroup from '../../components/SelectButtonGroup.svelte';
	import { reiverrApi } from '../../stores/user.store';

	let settings: LibrarySettingsDto | undefined = undefined;
	let cleanupError = '';

	const cleanupOptions: { label: string; value: LibrarySettingsDto['cleanup'] }[] = [
		{ label: 'Off', value: 'off' },
		{ label: 'Every day', value: 'daily' },
		{ label: 'Every Monday', value: 'weekly' },
		{ label: 'First of the month', value: 'monthly' }
	];

	reiverrApi.library.getLibrarySettings().then((r) => (settings = r.data));

	async function saveCleanup(value: string) {
		if (!settings) return;
		cleanupError = '';

		await reiverrApi.library
			.updateLibrarySettings({ ...settings, cleanup: value as LibrarySettingsDto['cleanup'] })
			.then((r) => (settings = r.data))
			.catch((e) => (cleanupError = e?.response?.data?.message ?? e?.message));
	}
</script>

<Container>
	<div class="mb-8">
		<h1 class="h3 mb-1">Library</h1>
		<p class="body">
			Downloaded episodes are imported into the library folders. Files that no request keeps are
			deleted at the cleanup.
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
	{/if}
</Container>
