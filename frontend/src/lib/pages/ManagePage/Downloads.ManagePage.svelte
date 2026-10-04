<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { DownloadSettingsDto, IndexerDto } from '$lib/apis/reiverr/reiverr.openapi';
	import { scrollIntoView } from '$lib/selectable';
	import classNames from 'classnames';
	import { Pencil2, Plus } from 'radix-icons-svelte';
	import Button from '../../components/Button/Button.svelte';
	import { createModal } from '../../components/Modal/modal.store';
	import SelectButtonGroup from '../../components/SelectButtonGroup.svelte';
	import SelectField from '../../components/SelectField.svelte';
	import TextField from '../../components/TextField.svelte';
	import { reiverrApi } from '../../stores/user.store';
	import EditIndexerDialog from './EditIndexerDialog.ManagePage.svelte';

	let indexers = getIndexers();
	let seedRatio = '';
	let savedSeedRatio = '';
	let seedRatioError = '';
	let cleanup: DownloadSettingsDto['cleanup'] | undefined = undefined;
	let cleanupError = '';

	const cleanupOptions: { label: string; value: DownloadSettingsDto['cleanup'] }[] = [
		{ label: 'Off', value: 'off' },
		{ label: 'Every day', value: 'daily' },
		{ label: 'Every Monday', value: 'weekly' },
		{ label: 'First of the month', value: 'monthly' }
	];

	reiverrApi.downloads.getDownloadSettings().then((r) => {
		seedRatio = savedSeedRatio = String(r.data.seedRatio);
		cleanup = r.data.cleanup;
	});

	function getIndexers(): Promise<IndexerDto[]> {
		return reiverrApi.indexers.getIndexers().then((r) => r.data.indexers);
	}

	async function saveSeedRatio() {
		if (!cleanup) return;
		seedRatioError = '';

		await reiverrApi.downloads
			.updateDownloadSettings({ seedRatio: Number(seedRatio), cleanup })
			.then((r) => (seedRatio = savedSeedRatio = String(r.data.seedRatio)))
			.catch((e) => (seedRatioError = e?.response?.data?.message ?? e?.message));
	}

	async function saveCleanup(value: string) {
		cleanupError = '';

		await reiverrApi.downloads
			.updateDownloadSettings({
				seedRatio: Number(savedSeedRatio),
				cleanup: value as DownloadSettingsDto['cleanup']
			})
			.then((r) => (cleanup = r.data.cleanup))
			.catch((e) => (cleanupError = e?.response?.data?.message ?? e?.message));
	}

	const editIndexer = (current: IndexerDto[], indexer?: IndexerDto) =>
		createModal(EditIndexerDialog, {
			indexers: current,
			indexer,
			onComplete: () => (indexers = getIndexers())
		});
</script>

<Container on:enter={scrollIntoView({ vertical: 128 })}>
	<div class="mb-8">
		<h1 class="h3 mb-1">Downloads</h1>
		<p class="body">
			Indexers are searched for the torrents of requested episodes. Downloaded episodes are added to
			the series library folder.
		</p>
	</div>
	{#await indexers then indexers}
		<Container class="flex flex-col space-y-4 mb-4 max-w-sm">
			{#each indexers as indexer (indexer.id)}
				<SelectField value={indexer.name} on:clickOrSelect={() => editIndexer(indexers, indexer)}>
					Indexer
					<Pencil2 slot="icon" let:size let:iconClass {size} class={classNames(iconClass)} />
				</SelectField>
			{/each}
		</Container>
		<Button icon={Plus} on:clickOrSelect={() => editIndexer(indexers)}>Add Indexer</Button>
	{/await}

	<Container class="flex flex-col space-y-4 mt-8 max-w-sm">
		<TextField type="number" value={seedRatio} on:change={({ detail }) => (seedRatio = detail)}>
			Seed ratio (uploaded / downloaded, 0 to not seed)
		</TextField>
		{#if seedRatioError}
			<p class="error">{seedRatioError}</p>
		{/if}
	</Container>
	<Button class="mt-4" disabled={seedRatio === savedSeedRatio} action={saveSeedRatio}>
		Save Seed Ratio
	</Button>

	{#if cleanup}
		<div class="mt-8 max-w-sm">
			<SelectButtonGroup
				name="Delete downloaded files that no request keeps (at 4:00)"
				options={cleanupOptions}
				selected={cleanup}
				on:select={({ detail }) => saveCleanup(detail)}
			/>
			{#if cleanupError}
				<p class="error mt-4">{cleanupError}</p>
			{/if}
		</div>
	{/if}
</Container>
