<script lang="ts">
	import { getJellyfinUsers } from '$lib/apis/jellyfin/jellyfinApi';
	import {
		getSonarrLanguageProfiles,
		getSonarrQualityProfiles,
		getSonarrRootFolders
	} from '$lib/apis/sonarr/sonarrApi';
	import FormButton from '$lib/components/forms/FormButton.svelte';
	import Input from '$lib/components/forms/Input.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import { settings, type SettingsValues } from '$lib/stores/settings.store';
	import classNames from 'classnames';
	import { Trash } from 'radix-icons-svelte';
	import IntegrationCard from './IntegrationCard.svelte';
	import TestConnectionButton from './TestConnectionButton.svelte';
	import { getRadarrQualityProfiles, getRadarrRootFolders } from '$lib/apis/radarr/radarrApi';

	export let values: SettingsValues;

	export let sonarrConnected: boolean;
	export let radarrConnected: boolean;
	export let jellyfinConnected: boolean;

	export let checkSonarrHealth: () => Promise<boolean>;
	export let checkRadarrHealth: () => Promise<boolean>;
	export let checkJellyfinHealth: () => Promise<boolean>;

	let sonarrRootFolders: undefined | { id: number; path: string }[] = undefined;
	let sonarrQualityProfiles: undefined | { id: number; name: string }[] = undefined;
	let sonarrLanguageProfiles: undefined | { id: number; name: string }[] = undefined;

	let radarrRootFolders: undefined | { id: number; path: string }[] = undefined;
	let radarrQualityProfiles: undefined | { id: number; name: string }[] = undefined;

	let jellyfinUsers: undefined | { id: string; name: string }[] = undefined;

	function handleRemoveIntegration(service: 'sonarr' | 'radarr' | 'jellyfin') {
		if (service === 'sonarr') {
			values.sonarr.baseUrl = '';
			values.sonarr.apiKey = '';

			checkSonarrHealth();
		} else if (service === 'radarr') {
			values.radarr.baseUrl = '';
			values.radarr.apiKey = '';
			checkRadarrHealth();
		} else if (service === 'jellyfin') {
			values.jellyfin.baseUrl = '';
			values.jellyfin.apiKey = '';
			values.jellyfin.userId = '';
			checkJellyfinHealth();
		}
	}

	$: {
		if (sonarrConnected) {
			getSonarrRootFolders(
				values.sonarr.baseUrl || undefined,
				values.sonarr.apiKey || undefined
			).then((folders) => {
				sonarrRootFolders = folders.map((f) => ({ id: f.id || 0, path: f.path || '' }));
			});

			getSonarrQualityProfiles(
				values.sonarr.baseUrl || undefined,
				values.sonarr.apiKey || undefined
			).then((profiles) => {
				sonarrQualityProfiles = profiles.map((p) => ({ id: p.id || 0, name: p.name || '' }));
			});

			getSonarrLanguageProfiles(
				values.sonarr.baseUrl || undefined,
				values.sonarr.apiKey || undefined
			).then((profiles) => {
				sonarrLanguageProfiles = profiles.map((p) => ({ id: p.id || 0, name: p.name || '' }));
			});
		}
	}

	$: {
		if (radarrConnected) {
			getRadarrRootFolders(
				values.radarr.baseUrl || undefined,
				values.radarr.apiKey || undefined
			).then((folders) => {
				radarrRootFolders = folders.map((f) => ({ id: f.id || 0, path: f.path || '' }));
			});

			getRadarrQualityProfiles(
				values.radarr.baseUrl || undefined,
				values.radarr.apiKey || undefined
			).then((profiles) => {
				radarrQualityProfiles = profiles.map((p) => ({ id: p.id || 0, name: p.name || '' }));
			});
		}
	}

	$: {
		if (jellyfinConnected) {
			getJellyfinUsers(
				values.jellyfin.baseUrl || undefined,
				values.jellyfin.apiKey || undefined
			).then((users) => {
				jellyfinUsers = users.map((u) => ({ id: u.Id || '', name: u.Name || '' }));
			});
		}
	}
</script>

<div class="grid grid-cols-2 gap-4">
	<div
		class="border-b border-zinc-800 pb-4 mt-8 col-span-2 justify-self-stretch flex flex-col gap-2"
	>
		<h1 class="font-medium text-2xl text-zinc-200 tracking-wide">Integrations</h1>
		<p class="text-sm text-zinc-400">
			Note: Base urls must be accessible from the browser, meaning that internal docker addresses
			won't work, for example. API Keys <span class="font-medium underline">will be exposed</span> to
			the browser.
		</p>
	</div>

	<div class="justify-self-stretch col-span-2">
		<IntegrationCard
			title="Sonarr"
			href={$settings.sonarr.baseUrl || '#'}
			status={sonarrConnected ? 'connected' : 'disconnected'}
		>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">Base URL</h2>
				<Input
					placeholder={'http://127.0.0.1:8989'}
					class="w-full"
					bind:value={values.sonarr.baseUrl}
				/>
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">API Key</h2>
				<Input class="w-full" bind:value={values.sonarr.apiKey} />
			</div>
			<div class="grid grid-cols-[1fr_min-content] gap-2">
				<TestConnectionButton handleHealthCheck={checkSonarrHealth} />
				<FormButton on:click={() => handleRemoveIntegration('sonarr')} type="error">
					<Trash size={20} />
				</FormButton>
			</div>
			<h1 class="border-b border-zinc-800 py-2">Options</h1>
			<div
				class={classNames(
					'grid grid-cols-[1fr_min-content] justify-items-start gap-4 text-zinc-400',
					{
						'opacity-50 pointer-events-none': !sonarrConnected
					}
				)}
			>
				<h2>Root Folder</h2>
				{#if !sonarrRootFolders}
					<Select loading />
				{:else}
					<Select bind:value={values.sonarr.rootFolderPath}>
						{#each sonarrRootFolders as folder}
							<option value={folder.path}>{folder.path}</option>
						{/each}
					</Select>
				{/if}

				<h2>Quality Profile</h2>
				{#if !sonarrQualityProfiles}
					<Select loading />
				{:else}
					<Select bind:value={values.sonarr.qualityProfileId}>
						{#each sonarrQualityProfiles as profile}
							<option value={profile.id}>{profile.name}</option>
						{/each}
					</Select>
				{/if}

				<h2>Language Profile</h2>
				{#if !sonarrLanguageProfiles}
					<Select loading />
				{:else}
					<Select bind:value={values.sonarr.languageProfileId}>
						{#each sonarrLanguageProfiles as profile}
							<option value={profile.id}>{profile.name}</option>
						{/each}
					</Select>
				{/if}
			</div>
		</IntegrationCard>
	</div>

	<div class="justify-self-stretch col-span-2">
		<IntegrationCard
			title="Radarr"
			href={$settings.radarr.baseUrl || '#'}
			status={radarrConnected ? 'connected' : 'disconnected'}
		>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">Base URL</h2>
				<Input
					placeholder={'http://127.0.0.1:7878'}
					class="w-full"
					bind:value={values.radarr.baseUrl}
				/>
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">API Key</h2>
				<Input class="w-full" bind:value={values.radarr.apiKey} />
			</div>
			<div class="grid grid-cols-[1fr_min-content] gap-2">
				<TestConnectionButton handleHealthCheck={checkRadarrHealth} />
				<FormButton on:click={() => handleRemoveIntegration('radarr')} type="error">
					<Trash size={20} />
				</FormButton>
			</div>
			<h1 class="border-b border-zinc-800 py-2">Options</h1>
			<div
				class={classNames(
					'grid grid-cols-[1fr_min-content] justify-items-start gap-4 text-zinc-400',
					{
						'opacity-50 pointer-events-none': !radarrConnected
					}
				)}
			>
				<h2>Root Folder</h2>
				{#if !radarrRootFolders}
					<Select loading />
				{:else}
					<Select bind:value={values.radarr.rootFolderPath}>
						{#each radarrRootFolders as folder}
							<option value={folder.path}>{folder.path}</option>
						{/each}
					</Select>
				{/if}

				<h2>Quality Profile</h2>
				{#if !radarrQualityProfiles}
					<Select loading />
				{:else}
					<Select bind:value={values.radarr.qualityProfileId}>
						{#each radarrQualityProfiles as profile}
							<option value={profile.id}>{profile.name}</option>
						{/each}
					</Select>
				{/if}
			</div>
		</IntegrationCard>
	</div>

	<div class="justify-self-stretch col-span-2">
		<IntegrationCard
			title="Jellyfin"
			href={$settings.jellyfin.baseUrl || '#'}
			status={jellyfinConnected ? 'connected' : 'disconnected'}
		>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">Base URL</h2>
				<Input
					placeholder={'http://127.0.0.1:8096'}
					class="w-full"
					bind:value={values.jellyfin.baseUrl}
				/>
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">API Key</h2>
				<Input class="w-full" bind:value={values.jellyfin.apiKey} />
			</div>
			<div class="grid grid-cols-[1fr_min-content] gap-2">
				<TestConnectionButton handleHealthCheck={checkJellyfinHealth} />
				<FormButton on:click={() => handleRemoveIntegration('jellyfin')} type="error">
					<Trash size={20} />
				</FormButton>
			</div>
			<h1 class="border-b border-zinc-800 py-2">Options</h1>
			<div
				class={classNames(
					'grid grid-cols-[1fr_min-content] justify-items-start gap-4 text-zinc-400',
					{
						'opacity-50 pointer-events-none': !jellyfinConnected
					}
				)}
			>
				<h2>Jellyfin User</h2>
				{#if !jellyfinUsers}
					<Select loading />
				{:else}
					<Select bind:value={values.jellyfin.userId}>
						{#each jellyfinUsers as user}
							<option value={user.id}>{user.name}</option>
						{/each}
					</Select>
				{/if}
			</div>
		</IntegrationCard>
	</div>
</div>