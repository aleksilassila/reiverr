<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { IndexerDto } from '$lib/apis/reiverr/reiverr.openapi';
	import { updateIndexers } from '$lib/queries/indexers.queries';
	import { Pencil1, Trash } from 'radix-icons-svelte';
	import Button from '../../components/Button/Button.svelte';
	import Dialog from '../../components/Dialog/Dialog.svelte';
	import { useComponentStack } from '../../components/StackRouter/stack-router.store';
	import TextField from '../../components/TextField.svelte';

	interface Props {
		indexers: IndexerDto[];
		/** The indexer to edit; a new one is added without it */
		indexer?: IndexerDto | undefined;
	}

	let { indexers, indexer = undefined }: Props = $props();

	const { close } = useComponentStack();

	let name = $state(indexer?.name ?? '');
	let url = $state(indexer?.url ?? '');
	let apiKey = $state(indexer?.apiKey ?? '');
	let error = $state('');

	async function save(next: IndexerDto[]) {
		error = '';

		await updateIndexers(next)
			.then(() => close())
			.catch((e) => (error = e?.response?.data?.message ?? e?.message));
	}

	const handleSave = () =>
		save(
			indexer
				? indexers.map((i) => (i.id === indexer?.id ? { ...i, name, url, apiKey } : i))
				: [...indexers, { name, url, apiKey }]
		);

	const handleRemove = () => save(indexers.filter((i) => i.id !== indexer?.id));
</script>

<Dialog>
	<h1 class="h3">{indexer ? 'Edit Indexer' : 'Add Indexer'}</h1>
	<p class="body mb-4">A Torznab feed from Jackett or Prowlarr</p>
	<Container class="flex flex-col space-y-4 mb-8">
		<TextField
			variant="primary-dark"
			value={name}
			onChange={(e) => (name = e)}
			placeholder="Jackett"
		>
			Name
		</TextField>
		<TextField
			variant="primary-dark"
			value={url}
			onChange={(e) => (url = e)}
			placeholder="http://127.0.0.1:9117/api/v2.0/indexers/all/results/torznab/"
		>
			Torznab URL
		</TextField>
		<TextField variant="primary-dark" type="password" value={apiKey} onChange={(e) => (apiKey = e)}>
			API Key
		</TextField>
		{#if error}
			<p class="error">{error}</p>
		{/if}
	</Container>

	<Container direction="horizontal" class="flex space-x-4">
		{#if indexer}
			<Button type="primary-dark" confirmDanger action={handleRemove} icon={Trash}>Remove</Button>
		{/if}
		<Button defaultFocus type="primary-dark" class="flex-1" action={handleSave} icon={Pencil1}>
			Save
		</Button>
	</Container>
</Dialog>
