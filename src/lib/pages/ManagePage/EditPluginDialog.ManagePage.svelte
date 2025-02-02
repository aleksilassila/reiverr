<script lang="ts">
	import { get, writable } from 'svelte/store';
	import Container from '$components/Container.svelte';
	import Button from '../../components/Button.svelte';
	import Dialog from '../../components/Dialog/Dialog.svelte';
	import { modalStack } from '../../components/Modal/modal.store';
	import TextField from '../../components/TextField.svelte';
	import Toggle from '../../components/Toggle.svelte';
	import { reiverrApiNew, user } from '../../stores/user.store';
	import { capitalize } from '../../utils';
	import type { ValidationResponsekDto } from '../../apis/reiverr/reiverr.openapi';
	import { Trash } from 'radix-icons-svelte';

	export let plugin: string;

	export let modalId: symbol;

	const settings = writable<Record<string, any>>({});

	const pluginSettingsTemplate = reiverrApiNew.sources
		.getSourceSettingsTemplate(plugin)
		.then((r) => r.data);

	const previousSettingsP = reiverrApiNew.users
		.findUserById(get(user)?.id || '')
		.then((r) => r.data)
		.then((user) => user.mediaSources?.find((s) => s.id === plugin)?.pluginSettings)
		.then((previousSettings) => settings.set(previousSettings || {}));

	let validationResponse: ValidationResponsekDto | undefined;

	async function handleSave() {
		// validationResponse = undefined;
		validationResponse = await reiverrApiNew.sources
			.validateSourceSettings(plugin, { settings: $settings })
			.then((r) => r.data);

		if (validationResponse?.isValid) {
			const replacedSettings = {
				...get(settings)
			};
			Object.keys(validationResponse?.replace).forEach((key) => {
				replacedSettings[key] = validationResponse?.replace[key];
			});
			await reiverrApiNew.users.updateSource(plugin, get(user)?.id || '', {
				pluginSettings: replacedSettings,
				enabled: true
			});
			modalStack.close(modalId);
		}
	}

	async function handleRemovePlugin() {
		await reiverrApiNew.users.deleteSource(plugin, get(user)?.id || '');
		await user.refreshUser();
		modalStack.close(modalId);
	}
</script>

<Dialog>
	<h1 class="header2">{capitalize(plugin)}</h1>
	<p class="body mb-8">Edit media source settings</p>
	{#await Promise.all([pluginSettingsTemplate, previousSettingsP]) then [pluginSettingsTemplate]}
		<Container class="flex flex-col gap-4 mb-8">
			{#if pluginSettingsTemplate?.settings}
				{#each Object.keys(pluginSettingsTemplate.settings) as key}
					{@const template = pluginSettingsTemplate.settings[key]}
					{#if template.type === 'string' || template.type === 'number' || template.type === 'password'}
						<TextField
							type={template.type}
							on:change={({ detail }) => settings.update((s) => ({ ...s, [key]: detail }))}
							value={$settings[key] || ''}
							placeholder={template.placeholder}
						>
							{template.label}
						</TextField>
						{#if validationResponse?.errors?.[key]}
							<p class="error mt-2">{validationResponse.errors[key]}</p>
						{/if}
					{:else if template.type === 'boolean'}
						<Toggle checked={false} />
					{:else if template.type === 'link'}
						<Button>Open</Button>
					{/if}
				{/each}
			{/if}
		</Container>

		<div class="mb-4">
			<Button type="primary-dark" confirmDanger action={handleRemovePlugin} icon={Trash}>
				Remove media source
			</Button>
		</div>

		<Container direction="horizontal" class="grid grid-cols-2 gap-4">
			<Button type="primary-dark" on:clickOrSelect={() => modalStack.close(modalId)}>Cancel</Button>
			<Button type="primary-dark" action={handleSave}>Save</Button>
		</Container>
	{/await}
</Dialog>
