<script lang="ts">
	import { Plus } from 'radix-icons-svelte';

	import Container from '$components/Container.svelte';
	import Button from '../../components/Button.svelte';
	import { reiverrApiNew, user } from '../../stores/user.store';
	import { createModal } from '../../components/Modal/modal.store';
	import SelectDialog from '../../components/Dialog/SelectDialog.svelte';
	import { get } from 'svelte/store';
	import { createErrorNotification } from '../../components/Notifications/notification.store';
	import PluginButton from './PluginButton.ManagePage.svelte';

	const availableSources = [];
	const allPlugins = reiverrApiNew.sources.getSourcePlugins().then((r) => r.data);
	let enabledPlugins = getEnabledPlugins();
	$: availablePlugins = Promise.all([allPlugins, enabledPlugins]).then(
		([allPlugins, enabledPlugins]) => allPlugins.filter((p) => !enabledPlugins.includes(p))
	);

	function getEnabledPlugins() {
		return reiverrApiNew.users
			.findUserById($user?.id || '')
			.then((r) => r.data.mediaSources?.map((source) => source.id) || []);
	}

	async function addSource(sourceId: string) {
		const userId = get(user)?.id;

		if (!userId) {
			createErrorNotification('User not found');
			return;
		}

		await reiverrApiNew.users.updateSource(sourceId, userId, { enabled: false });
		enabledPlugins = getEnabledPlugins();
	}
</script>

<div>
	<div class="mb-8">
		<h1 class="header2 mb-1">Media Soruces</h1>
		<p class="body">
			External media soruces allow reiverr to play content from different sources. Additional media
			sources can be added via external plugins.
		</p>
	</div>
	<Container class="flex gap-4 mb-4">
		{#await enabledPlugins then enabledPlugins}
			{#each enabledPlugins as plugin}
				<PluginButton {plugin} />
			{/each}
		{/await}
	</Container>
	{#await availablePlugins then availablePlugins}
		<Button
			icon={Plus}
			disabled={!availablePlugins.length}
			on:clickOrSelect={() =>
				createModal(SelectDialog, {
					options: availablePlugins,
					handleSelectOption: addSource,
					title: 'Add Media Sources'
				})}
		>
			Add Source
		</Button>
	{/await}
</div>
