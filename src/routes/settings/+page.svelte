<script lang="ts">
	import { version } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import { getJellyfinHealth, getJellyfinUsers } from '$lib/apis/jellyfin/jellyfinApi';
	import { getRadarrHealth } from '$lib/apis/radarr/radarrApi';
	import { getSonarrHealth } from '$lib/apis/sonarr/sonarrApi';
	import FormButton from '$lib/components/forms/FormButton.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import { settings, type SettingsValues } from '$lib/stores/settings.store';
	import axios from 'axios';
	import classNames from 'classnames';
	import { ChevronLeft } from 'radix-icons-svelte';
	import GeneralSettingsPage from './GeneralSettingsPage.svelte';
	import IntegrationSettingsPage from './IntegrationSettingsPage.svelte';
	import { fade } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import { createErrorNotification } from '$lib/stores/notification.store';

	type Section = 'general' | 'integrations';

	let openTab: Section = 'general';

	let sonarrConnected = false;
	let radarrConnected = false;
	let jellyfinConnected = false;

	let values: SettingsValues;
	let initialValues: SettingsValues;
	settings.subscribe(async (v) => {
		values = structuredClone(v);
		initialValues = structuredClone(v);
		const s = updateSonarrHealth();
		const r = updateRadarrHealth();
		const j = updateJellyfinHealth();

		await Promise.all([s, r, j]);

		checkForPartialConfiguration(v);
	});

	let valuesChanged = false;
	$: valuesChanged = JSON.stringify(initialValues) !== JSON.stringify(values);

	let submitLoading = false;
	function handleSubmit() {
		if (submitLoading || !valuesChanged) return;
		submitLoading = true;
		submit().finally(() => (submitLoading = false));
	}

	async function submit() {
		if (
			values.sonarr.apiKey &&
			values.sonarr.baseUrl &&
			!(await getSonarrHealth(values.sonarr.baseUrl, values.sonarr.apiKey))
		) {
			createErrorNotification(
				'Invalid Configuration',
				'Could not connect to Sonarr. Check Sonarr credentials.'
			);
			return;
		}

		if (
			values.radarr.apiKey &&
			values.radarr.baseUrl &&
			!(await getRadarrHealth(values.radarr.baseUrl, values.radarr.apiKey))
		) {
			createErrorNotification(
				'Invalid Configuration',
				'Could not connect to Radarr. Check Radarr credentials.'
			);
			return;
		}

		if (values.jellyfin.apiKey && values.jellyfin.baseUrl) {
			if (!(await getJellyfinHealth(values.jellyfin.baseUrl, values.jellyfin.apiKey))) {
				createErrorNotification(
					'Invalid Configuration',
					'Could not connect to Jellyfin. Check Jellyfin credentials.'
				);
				return;
			}
			const users = await getJellyfinUsers(values.jellyfin.baseUrl, values.jellyfin.apiKey);
			if (!users.find((u) => u.Id === values.jellyfin.userId)) values.jellyfin.userId = null;
		}

		updateSonarrHealth();
		updateRadarrHealth();
		updateJellyfinHealth();

		axios.post('/api/settings', values).then(() => {
			settings.set(values);
		});
	}

	function checkForPartialConfiguration(v: SettingsValues) {
		let error = '';
		if (sonarrConnected && !v.sonarr.rootFolderPath) {
			error = 'Sonarr disabled: Root folder path is required';
		} else if (sonarrConnected && !v.sonarr.qualityProfileId) {
			error = 'Sonarr disabled: Quality profile is required';
		} else if (sonarrConnected && !v.sonarr.languageProfileId) {
			error = 'Sonarr disabled: Language profile is required';
		}

		if (radarrConnected && !v.radarr.rootFolderPath) {
			error = 'Radarr disabled: Root folder path is required';
		} else if (radarrConnected && !v.radarr.qualityProfileId) {
			error = 'Radarr disabled: Quality profile is required';
		}

		if (jellyfinConnected && !v.jellyfin.userId) {
			error = 'Jellyfin disabled: User is required';
		}
		if (error) createErrorNotification('Incomplete Configuration', error, 'warning');
	}

	async function updateSonarrHealth(reset = false): Promise<boolean> {
		if (!values.sonarr.baseUrl || !values.sonarr.apiKey || reset) {
			sonarrConnected = false;
			return false;
		}
		return getSonarrHealth(
			values.sonarr.baseUrl || undefined,
			values.sonarr.apiKey || undefined
		).then((ok) => {
			sonarrConnected = ok;
			return ok;
		});
	}

	async function updateRadarrHealth(reset = false): Promise<boolean> {
		if (!values.radarr.baseUrl || !values.radarr.apiKey || reset) {
			radarrConnected = false;
			return false;
		}
		return getRadarrHealth(
			values.radarr.baseUrl || undefined,
			values.radarr.apiKey || undefined
		).then((ok) => {
			radarrConnected = ok;
			return ok;
		});
	}

	async function updateJellyfinHealth(reset = false): Promise<boolean> {
		if (!values.jellyfin.baseUrl || !values.jellyfin.apiKey || reset) {
			jellyfinConnected = false;
			return false;
		}

		return getJellyfinHealth(
			values.jellyfin.baseUrl || undefined,
			values.jellyfin.apiKey || undefined
		).then((ok) => {
			jellyfinConnected = ok;
			return ok;
		});
	}

	const getNavButtonStyle = (section: Section) =>
		classNames('rounded-xl p-2 px-6 font-medium text-left', {
			'text-zinc-200 bg-lighten': openTab === section,
			'text-zinc-300 hover:text-zinc-200': openTab !== section
		});

	beforeNavigate(({ cancel }) => {
		if (valuesChanged) {
			if (!confirm('You have unsaved changes. Are you sure you want to leave?')) cancel();
		}
	});

	function handleKeybinds(event: KeyboardEvent) {
		if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			handleSubmit();
		}
	}
</script>

<svelte:window on:keydown={handleKeybinds} />

<div
	class="min-h-screen sm:h-screen flex-1 flex flex-col sm:flex-row w-full sm:pt-24"
	in:fade|global={{
		duration: $settings.animationDuration,
		delay: $settings.animationDuration
	}}
	out:fade|global={{ duration: $settings.animationDuration }}
>
	<div
		class="hidden sm:flex flex-col gap-2 border-r border-zinc-800 justify-between w-64 p-8 border-t"
	>
		<div class="flex flex-col gap-2">
			<button
				class="mb-6 text-lg font-medium flex items-center text-zinc-300 hover:text-zinc-200"
				on:click={() => history.back()}
			>
				<ChevronLeft size={22} />
				{$_('settings.navbar.settings')}
			</button>
			<button
				on:click={() => (openTab = 'general')}
				class={openTab && getNavButtonStyle('general')}
			>
				{$_('settings.navbar.general')}
			</button>
			<button
				on:click={() => (openTab = 'integrations')}
				class={openTab && getNavButtonStyle('integrations')}
			>
				{$_('settings.navbar.integrations')}
			</button>
		</div>
		<div class="flex flex-col gap-2">
			<FormButton
				disabled={!valuesChanged}
				loading={submitLoading}
				on:click={handleSubmit}
				type={valuesChanged ? 'success' : 'base'}
			>
				{$_('settings.misc.saveChanges')}
			</FormButton>
			<FormButton
				disabled={!valuesChanged}
				type="error"
				on:click={() => {
					settings.set(initialValues);
				}}
			>
				{$_('settings.misc.resetToDefaults')}
			</FormButton>
		</div>
	</div>

	<div class="sm:hidden px-8 pt-20 pb-4 flex items-center justify-between">
		<button
			class="text-lg font-medium flex items-center text-zinc-300 hover:text-zinc-200"
			on:click={() => history.back()}
		>
			<ChevronLeft size={22} />
			{$_('settings.navbar.settings')}
		</button>
		<Select bind:value={openTab}>
			<option value="general"> {$_('settings.navbar.general')} </option>
			<option value="integrations">
				{$_('settings.navbar.integrations')}
			</option>
		</Select>
	</div>

	<div class="flex-1 flex flex-col border-t border-zinc-800 justify-between">
		<div class="overflow-y-scroll overflow-x-hidden px-8">
			<div class="max-w-screen-md mx-auto mb-auto w-full">
				{#if openTab === 'general'}
					<GeneralSettingsPage bind:values />
				{/if}

				{#if openTab === 'integrations'}
					<IntegrationSettingsPage
						bind:values
						{sonarrConnected}
						{radarrConnected}
						{jellyfinConnected}
						{updateSonarrHealth}
						{updateRadarrHealth}
						{updateJellyfinHealth}
					/>
				{/if}
			</div>
		</div>
		<div class="flex items-center p-4 gap-8 justify-center text-zinc-500 bg-stone-950">
			<div>v{version}</div>
			<a target="_blank" href="https://github.com/aleksilassila/reiverr/releases">
				{$_('settings.misc.changelog')}
			</a>
			<a target="_blank" href="https://github.com/aleksilassila/reiverr">GitHub</a>
		</div>
	</div>
</div>

<!-- Language settings -->
