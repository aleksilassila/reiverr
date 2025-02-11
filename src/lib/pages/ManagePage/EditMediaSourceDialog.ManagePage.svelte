<script lang="ts">
	import Container from '$components/Container.svelte';
	import type { ValidationResponseDto } from '$lib/apis/reiverr/reiverr.openapi';
	import { Pencil1, Trash } from 'radix-icons-svelte';
	import { get, writable } from 'svelte/store';
	import Button from '../../components/Button.svelte';
	import Dialog from '../../components/Dialog/Dialog.svelte';
	import { modalStack } from '../../components/Modal/modal.store';
	import TextField from '../../components/TextField.svelte';
	import Toggle from '../../components/Toggle.svelte';
	import { reiverrApiNew, user } from '../../stores/user.store';

	export let modalId: symbol;

	export let sourceId: string;

	const name = writable('');
	const priority = writable<number | undefined>(undefined);
	const settings = writable<Record<string, any>>({});

	const mediaSource = reiverrApiNew.users
		.findUserById(get(user)?.id || '')
		.then((r) => r.data.mediaSources?.find((s) => s.id === sourceId)!);

	mediaSource.then((source) => {
		if (!source) throw new Error('Media source not found');
		const previousSettings = source.pluginSettings;
		settings.set(previousSettings || {});
		name.set(source.name ?? source.pluginId);
		priority.set(source.priority);
		sourceId = source.id;
	});

	const pluginSettingsTemplate = mediaSource.then((source) =>
		reiverrApiNew.providers.getSourceSettingsTemplate(source.pluginId).then((r) => r.data)
	);

	let validationResponse: ValidationResponseDto | undefined;

	async function handleSave() {
		// validationResponse = undefined;
		const source = await mediaSource;
		validationResponse = await reiverrApiNew.providers
			.validateSourceSettings(source.pluginId, { settings: $settings })
			.then((r) => r.data);

		if (validationResponse?.isValid) {
			const replacedSettings = {
				...get(settings)
			};
			Object.keys(validationResponse?.replace).forEach((key) => {
				replacedSettings[key] = validationResponse?.replace[key];
			});
			await reiverrApiNew.users.updateSource(get(user)?.id || '', {
				id: sourceId,
				name: $name,
				pluginId: source.pluginId,
				pluginSettings: replacedSettings,
				enabled: true
			});
			modalStack.close(modalId);
		}
	}

	async function handleRemovePlugin() {
		await mediaSource.then((s) => reiverrApiNew.users.deleteSource(s.id, get(user)?.id || ''));
		await user.refreshUser();
		modalStack.close(modalId);
	}
</script>

<Dialog>
	{#await Promise.all([mediaSource, pluginSettingsTemplate])}
		Loading...
	{:then [mediaSource, pluginSettingsTemplate]}
		<h1 class="h3">
			{mediaSource.name}
		</h1>
		<p class="body mb-4">Edit media source settings</p>
		<Container class="flex flex-col gap-4 mb-8">
			<TextField on:change={({ detail }) => name.set(detail)} value={$name} placeholder="Name">
				Name
			</TextField>
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

		<Container direction="horizontal" class="flex gap-4">
			<Button type="primary-dark" class="flex-1" action={handleSave} icon={Pencil1}>Save</Button>
			<Button type="primary-dark" confirmDanger action={handleRemovePlugin} icon={Trash}>
				Remove media source
			</Button>
		</Container>
	{/await}
</Dialog>
