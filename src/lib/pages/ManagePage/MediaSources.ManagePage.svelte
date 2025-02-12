<script lang="ts">
	import { Plus } from 'radix-icons-svelte';

	import Container from '$components/Container.svelte';
	import Button from '../../components/Button.svelte';
	import { reiverrApiNew, user } from '../../stores/user.store';
	import { createModal } from '../../components/Modal/modal.store';
	import SelectDialog from '../../components/Dialog/SelectDialog.svelte';
	import { get } from 'svelte/store';
	import { createErrorNotification } from '../../components/Notifications/notification.store';
	import MediaSourceButton from './MediaSourceButton.ManagePage.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import { mediaSourcesDataStore } from '$lib/stores/data.store';

	const allPlugins = reiverrApiNew.providers.getSourceProviders().then((r) => r.data);

	const { promise: userSources } = mediaSourcesDataStore.getRequest();

	async function addSource(pluginId: string) {
		const userId = get(user)?.id;

		if (!userId) {
			createErrorNotification('User not found');
			return;
		}

		await reiverrApiNew.users.updateSource(userId, { pluginId });
		await mediaSourcesDataStore.refresh();
	}
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
		{#await $userSources then userSources}
			{#each userSources as source}
				<MediaSourceButton mediaSource={source} />
			{/each}
		{/await}
	</Container>
	{#await allPlugins then availablePlugins}
		<Button
			icon={Plus}
			disabled={!availablePlugins.length}
			on:clickOrSelect={() =>
				createModal(SelectDialog, {
					options: availablePlugins,
					handleSelectOption: addSource,
					title: 'Add Media Source',
					subtitle: 'Select a source provider'
				})}
		>
			Add Source
		</Button>
	{/await}
</Container>
