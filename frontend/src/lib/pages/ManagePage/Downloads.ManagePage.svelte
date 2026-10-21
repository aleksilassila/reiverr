<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { IndexerDto } from '$lib/apis/reiverr/reiverr.openapi';
	import { scrollIntoView } from '$lib/selectable';
	import classNames from 'classnames';
	import { Pencil2, Plus } from 'radix-icons-svelte';
	import Button from '../../components/Button/Button.svelte';
	import { createModal } from '../../components/Modal/modal.store';
	import SelectField from '../../components/SelectField.svelte';
	import TextField from '../../components/TextField.svelte';
	import { reiverrApi } from '../../stores/user.store';
	import EditIndexerDialog from './EditIndexerDialog.ManagePage.svelte';

	let indexers = getIndexers();
	let seedRatio = '';
	let savedSeedRatio = '';
	let seedRatioError = '';

	reiverrApi.downloads.getDownloadSettings().then((r) => {
		seedRatio = savedSeedRatio = String(r.data.seedRatio);
	});

	function getIndexers(): Promise<IndexerDto[]> {
		return reiverrApi.indexers.getIndexers().then((r) => r.data.indexers);
	}

	async function saveSeedRatio() {
		seedRatioError = '';

		await reiverrApi.downloads
			.updateDownloadSettings({ seedRatio: Number(seedRatio) })
			.then((r) => (seedRatio = savedSeedRatio = String(r.data.seedRatio)))
			.catch((e) => (seedRatioError = e?.response?.data?.message ?? e?.message));
	}

	const editIndexer = (current: IndexerDto[], indexer?: IndexerDto) =>
		createModal(EditIndexerDialog, {
			indexers: current,
			indexer,
			onComplete: () => (indexers = getIndexers())
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
	{#await indexers then indexers}
		<Container class="flex flex-col space-y-4 mb-4 max-w-sm">
			{#each indexers as indexer (indexer.id)}
				<SelectField
					value={indexer.name}
					on:enter={scrollIntoView({ vertical: 128 })}
					on:clickOrSelect={() => editIndexer(indexers, indexer)}
				>
					Indexer
					<Pencil2 slot="icon" let:size let:iconClass {size} class={classNames(iconClass)} />
				</SelectField>
			{/each}
		</Container>
		<Button
			icon={Plus}
			on:enter={scrollIntoView({ vertical: 128 })}
			on:clickOrSelect={() => editIndexer(indexers)}
		>
			Add Indexer
		</Button>
	{/await}

	<Container class="flex flex-col space-y-4 mt-8 max-w-sm">
		<TextField
			type="number"
			value={seedRatio}
			on:enter={scrollIntoView({ vertical: 128 })}
			on:change={({ detail }) => (seedRatio = detail)}
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
		on:enter={scrollIntoView({ vertical: 128 })}
	>
		Save Seed Ratio
	</Button>
</Container>
