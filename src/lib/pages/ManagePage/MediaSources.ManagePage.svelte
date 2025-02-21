<script lang="ts">
	import { Plus } from 'radix-icons-svelte';

	import Container from '$components/Container.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import { sources } from '$lib/stores/sources.store';
	import Button from '../../components/Button.svelte';
	import SelectDialog from '../../components/Dialog/SelectDialog.svelte';
	import { createModal } from '../../components/Modal/modal.store';
	import { reiverrApiNew } from '../../stores/user.store';
	import MediaSourceButton from './MediaSourceButton.ManagePage.svelte';

	const allProviders = reiverrApiNew.providers.getSourceProviders().then((r) => r.data);

	const { isLoading, addSource, ...userSources } = sources;
</script>

<Container on:enter={scrollIntoView({ vertical: 128 })}>
	<div class="mb-8">
		<h1 class="h3 mb-1">Media Soruces</h1>
		<p class="body">
			External media soruces allow reiverr to play content from different sources. Additional media
			sources can be added via external plugins.
		</p>
	</div>
	<Container class="flex flex-col gap-4 mb-4 max-w-sm">
		{#if $isLoading}
			<p>Loading...</p>
		{:else}
			{#each $userSources as source}
				<MediaSourceButton mediaSource={source} />
			{/each}
		{/if}
	</Container>
	{#await allProviders then availablePlugins}
		<Button
			icon={Plus}
			disabled={!availablePlugins.length}
			on:clickOrSelect={() =>
				createModal(SelectDialog, {
					options: availablePlugins,
					handleSelectOption: (id) => addSource(id),
					title: 'Add Media Source',
					subtitle: 'Select a source provider'
				})}
		>
			Add Source
		</Button>
	{/await}
</Container>
