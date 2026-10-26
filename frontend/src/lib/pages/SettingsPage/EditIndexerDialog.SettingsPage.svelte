<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { IndexerDto } from '$lib/apis/reiverr/reiverr.openapi';
	import { updateIndexers } from '$lib/queries/downloads.queries';
	import { Pencil1, Trash } from 'radix-icons-svelte';
	import Button from '../../components/Button/Button.svelte';
	import Dialog from '../../components/Dialog/Dialog.svelte';
	import { useComponentStack } from '../../components/StackRouter/stack-router.store';
	import TextField from '../../components/TextField.svelte';

	export let indexers: IndexerDto[];
	/** The indexer to edit; a new one is added without it */
	export let indexer: IndexerDto | undefined = undefined;

	const { close } = useComponentStack();

	let name = indexer?.name ?? '';
	let url = indexer?.url ?? '';
	let apiKey = indexer?.apiKey ?? '';
	let error = '';

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
			on:change={({ detail }) => (name = detail)}
			placeholder="Jackett"
		>
			Name
		</TextField>
		<TextField
			variant="primary-dark"
			value={url}
			on:change={({ detail }) => (url = detail)}
			placeholder="http://127.0.0.1:9117/api/v2.0/indexers/all/results/torznab/"
		>
			Torznab URL
		</TextField>
		<TextField
			variant="primary-dark"
			type="password"
			value={apiKey}
			on:change={({ detail }) => (apiKey = detail)}
		>
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
		<Button focusedChild type="primary-dark" class="flex-1" action={handleSave} icon={Pencil1}>
			Save
		</Button>
	</Container>
</Dialog>
