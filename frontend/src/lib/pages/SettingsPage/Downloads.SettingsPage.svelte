<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { IndexerDto } from '$lib/apis/reiverr/reiverr.openapi';
	import { downloadsQueries, updateDownloadSettings } from '$lib/queries/downloads.queries';
	import { indexersQueries } from '$lib/queries/indexers.queries';
	import { usePageQuery } from '$lib/queries/page-query';
	import { scrollIntoView } from '$lib/selectable';
	import classNames from 'classnames';
	import { Pencil2, Plus } from 'radix-icons-svelte';
	import Button from '../../components/Button/Button.svelte';
	import { createModal } from '../../components/Modal/modal.store';
	import SelectField from '../../components/SelectField.svelte';
	import TextField from '../../components/TextField.svelte';
	import Toggle from '../../components/Toggle.svelte';
	import EditIndexerDialog from './EditIndexerDialog.SettingsPage.svelte';

	const indexersQuery = usePageQuery(indexersQueries.list());
	const settingsQuery = usePageQuery(downloadsQueries.settings());

	/** What is typed into the seed ratio field, until it is saved */
	let seedRatioInput: string | undefined = $state();
	let seedRatioError = $state('');
	let subtitlesError = $state('');

	let settings = $derived($settingsQuery.data);
	let savedSeedRatio = $derived(settings ? String(settings.seedRatio) : '');
	let seedRatio = $derived(seedRatioInput ?? savedSeedRatio);

	const errorMessage = (e: any) => e?.response?.data?.message ?? e?.message;

	async function saveSeedRatio() {
		if (!settings) return;
		seedRatioError = '';

		await updateDownloadSettings({ ...settings, seedRatio: Number(seedRatio) })
			.then(() => (seedRatioInput = undefined))
			.catch((e) => (seedRatioError = errorMessage(e)));
	}

	async function saveDownloadSubtitles(downloadSubtitles: boolean) {
		if (!settings) return;
		subtitlesError = '';

		await updateDownloadSettings({ ...settings, downloadSubtitles }).catch(
			(e) => (subtitlesError = errorMessage(e))
		);
	}

	const editIndexer = (current: IndexerDto[], indexer?: IndexerDto) =>
		createModal(EditIndexerDialog, {
			indexers: current,
			indexer
		});
</script>

<Container>
	<div class="mb-8">
		<h1 class="h3 mb-1">Downloads</h1>
		<p class="body">
			Indexers are searched for the torrents of requested episodes. Downloaded episodes are added to
			the series library folder.
		</p>
	</div>
	{#if $indexersQuery.data}
		{@const indexers = $indexersQuery.data}
		<Container class="flex flex-col space-y-4 mb-4 max-w-sm">
			{#each indexers as indexer (indexer.id)}
				<SelectField
					value={indexer.name}
					onEnter={scrollIntoView({ vertical: 128 })}
					onClickOrSelect={() => editIndexer(indexers, indexer)}
				>
					Indexer
					{#snippet icon({ size, iconClass })}
						<Pencil2 {size} class={classNames(iconClass)} />
					{/snippet}
				</SelectField>
			{/each}
		</Container>
		<Button
			icon={Plus}
			onEnter={scrollIntoView({ vertical: 128 })}
			onClickOrSelect={() => editIndexer(indexers)}
		>
			Add Indexer
		</Button>
	{:else if $indexersQuery.error}
		<p class="error">{errorMessage($indexersQuery.error)}</p>
	{/if}

	{#if settings}
		<Container class="mt-8 max-w-sm">
			<Toggle
				label="Download subtitles found in torrents"
				checked={settings.downloadSubtitles}
				onChange={(e) => saveDownloadSubtitles(e)}
			/>
			{#if subtitlesError}
				<p class="error mt-4">{subtitlesError}</p>
			{/if}
		</Container>
	{:else if $settingsQuery.error}
		<p class="error mt-8">{errorMessage($settingsQuery.error)}</p>
	{/if}

	<Container class="flex flex-col space-y-4 mt-8 max-w-sm">
		<TextField
			type="number"
			value={seedRatio}
			onEnter={scrollIntoView({ vertical: 128 })}
			onChange={(e) => (seedRatioInput = e)}
		>
			Seed ratio (uploaded / downloaded, 0 to not seed)
		</TextField>
		{#if seedRatioError}
			<p class="error">{seedRatioError}</p>
		{/if}
	</Container>
	<Button
		class="mt-4"
		disabled={seedRatio === savedSeedRatio}
		action={saveSeedRatio}
		onEnter={scrollIntoView({ vertical: 128 })}
	>
		Save Seed Ratio
	</Button>
</Container>
