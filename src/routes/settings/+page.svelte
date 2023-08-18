<script lang="ts">
	import { version } from '$app/environment';
	import { getRadarrHealth } from '$lib/apis/radarr/radarrApi';
	import { getSonarrHealth } from '$lib/apis/sonarr/sonarrApi';
	import FormButton from '$lib/components/forms/FormButton.svelte';
	import Input from '$lib/components/forms/Input.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import Toggle from '$lib/components/forms/Toggle.svelte';
	import { settings, type SettingsValues } from '$lib/stores/settings.store';
	import axios from 'axios';
	import classNames from 'classnames';
	import { ChevronLeft } from 'radix-icons-svelte';
	import IntegrationCard from './IntegrationCard.svelte';
	import { getJellyfinHealth, getJellyfinUsers } from '$lib/apis/jellyfin/jellyfinApi';
	import { beforeNavigate } from '$app/navigation';

	type Section = 'general' | 'integrations';

	let openTab: Section = 'integrations';

	type Health = undefined | 'loading' | boolean;

	let sonarrHealth: Health;
	let radarrHealth: Health;
	let jellyfinHealth: Health;

	let jellyfinUsers: undefined | { id: string; name: string }[] = undefined;

	let values: SettingsValues;
	let initialValues: SettingsValues;
	settings.subscribe((v) => {
		values = structuredClone(v);
		initialValues = structuredClone(v);
		if (values.jellyfin.baseUrl && values.jellyfin.apiKey) handleJellyfinHealthcheck();
		if (values.sonarr.baseUrl && values.sonarr.apiKey) handleSonarrHealthcheck();
		if (values.radarr.baseUrl && values.radarr.apiKey) handleRadarrHealthcheck();
	});

	let submitLoading = false;
	function handleSubmit() {
		if (submitLoading) return;
		submitLoading = true;
		submit().finally(() => (submitLoading = false));
	}

	async function submit() {
		if (
			values.sonarr.apiKey &&
			values.sonarr.baseUrl &&
			!(await getSonarrHealth(values.sonarr.baseUrl, values.sonarr.apiKey))
		) {
			throw new Error('Could not connect to Sonarr');
		}

		if (
			values.radarr.apiKey &&
			values.radarr.baseUrl &&
			!(await getRadarrHealth(values.radarr.baseUrl, values.radarr.apiKey))
		) {
			throw new Error('Could not connect to Radarr');
		}

		if (values.jellyfin.apiKey && values.jellyfin.baseUrl) {
			if (!(await getJellyfinHealth(values.jellyfin.baseUrl, values.jellyfin.apiKey)))
				throw new Error('Could not connect to Jellyfin');
			const users = await getJellyfinUsers(values.jellyfin.baseUrl, values.jellyfin.apiKey);
			if (!users.find((u) => u.Id === values.jellyfin.userId)) values.jellyfin.userId = null;
		}

		axios.post('/api/settings', values).then(() => {
			settings.set(values);
		});
	}

	function handleSonarrHealthcheck() {
		if (!values.sonarr.baseUrl || !values.sonarr.apiKey) {
			sonarrHealth = false;
			return;
		}
		sonarrHealth = 'loading';
		getSonarrHealth(values.sonarr.baseUrl, values.sonarr.apiKey).then((ok) => (sonarrHealth = ok));
	}

	function handleRadarrHealthcheck() {
		if (!values.radarr.baseUrl || !values.radarr.apiKey) {
			radarrHealth = false;
			return;
		}

		radarrHealth = 'loading';
		getRadarrHealth(values.radarr.baseUrl, values.radarr.apiKey).then((ok) => (radarrHealth = ok));
	}

	function handleJellyfinHealthcheck() {
		if (!values.jellyfin.baseUrl || !values.jellyfin.apiKey) {
			jellyfinHealth = false;
			return;
		}

		jellyfinHealth = 'loading';
		getJellyfinHealth(values.jellyfin.baseUrl, values.jellyfin.apiKey).then((ok) => {
			jellyfinHealth = ok;
			if (ok) {
				getJellyfinUsers(values.jellyfin.baseUrl, values.jellyfin.apiKey).then((users) => {
					jellyfinUsers = [];
					for (const user of users) {
						if (!user.Id || !user.Name) continue;
						jellyfinUsers.push({ id: user.Id, name: user.Name });
					}
				});
			}
		});
	}

	const getNavButtonStyle = (section: Section) =>
		classNames('rounded-xl p-2 px-6 font-medium text-left', {
			'bg-zinc-800 text-amber-200': openTab === section,
			'text-zinc-300 hover:text-zinc-200': openTab !== section
		});

	const getButtonType = (health: Health) => {
		if (health === undefined || health === 'loading') return 'base';
		return health ? 'success' : 'error';
	};

	beforeNavigate(({ cancel }) => {
		if (JSON.stringify(initialValues) !== JSON.stringify(values)) {
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

<div class="h-screen flex-1 flex flex-col sm:flex-row w-full sm:pt-24">
	<div
		class="hidden sm:flex flex-col gap-2 border-r border-zinc-800 justify-between w-64 p-8 border-t"
	>
		<div class="flex flex-col gap-2">
			<button
				class="mb-6 text-lg font-medium flex items-center text-zinc-300 hover:text-zinc-200"
				on:click={() => history.back()}
			>
				<ChevronLeft size={22} /> Settings
			</button>
			<button
				on:click={() => (openTab = 'general')}
				class={openTab && getNavButtonStyle('general')}
			>
				General
			</button>
			<button
				on:click={() => (openTab = 'integrations')}
				class={openTab && getNavButtonStyle('integrations')}
			>
				Integrations
			</button>
		</div>
		<div class="flex flex-col gap-2">
			<FormButton
				disabled={JSON.stringify(initialValues) === JSON.stringify(values)}
				loading={submitLoading}
				on:click={handleSubmit}
			>
				Save Changes
			</FormButton>
			<FormButton
				disabled={JSON.stringify(initialValues) === JSON.stringify(values)}
				type="error"
				on:click={() => {
					settings.set(initialValues);
				}}
			>
				Reset to Defaults
			</FormButton>
		</div>
	</div>

	<div class="sm:hidden px-8 pt-20 pb-4 flex items-center justify-between">
		<button
			class="text-lg font-medium flex items-center text-zinc-300 hover:text-zinc-200"
			on:click={() => history.back()}
		>
			<ChevronLeft size={22} /> Settings
		</button>
		<Select bind:value={openTab}>
			<option value="general">General</option>
			<option value="integrations">Integrations</option>
		</Select>
	</div>

	<div class="flex-1 flex flex-col px-8 border-t border-zinc-800">
		<div class="max-w-screen-md mx-auto mb-auto overflow-y-scroll overflow-x-hidden w-full">
			{#if openTab === 'general'}
				<div class="grid grid-cols-[1fr_min-content] justify-items-start gap-4 text-zinc-400">
					<h1
						class="font-medium text-xl text-zinc-200 tracking-wide col-span-2 border-b border-zinc-800 justify-self-stretch pb-2 mt-8"
					>
						Language & Region
					</h1>
					<h2>Language</h2>
					<Select bind:value={values.language}>
						<option value="en">English</option>
						<option value="fi">Finnish</option>
					</Select>

					<h2>Region</h2>
					<Select bind:value={values.region}>
						<option value="US">United States</option>
						<option value="FI">Finland</option>
					</Select>

					<h1
						class="font-medium text-xl text-zinc-200 tracking-wide col-span-2 border-b border-zinc-800 justify-self-stretch pb-2 mt-8"
					>
						User Interface
					</h1>
					<h2>Autoplay Trailers</h2>
					<Toggle bind:checked={values.autoplayTrailers} />

					<h2>Animation Duration</h2>
					<Input type="number" bind:value={values.animationDuration} />

					<h1
						class="font-medium text-xl text-zinc-200 tracking-wide col-span-2 border-b border-zinc-800 justify-self-stretch pb-2 mt-8"
					>
						Discovery
					</h1>
					<div>
						<h2>Exclude library items from Discovery</h2>
						<p class="text-sm text-zinc-500">Exmample text explaining the above</p>
					</div>
					<Toggle bind:checked={values.excludeLibraryItemsFromDiscovery} />

					<!-- <h2>Discover</h2> -->
					<!-- <h3>Included Languages</h3>
					<Toggle bind:checked={values.discover.includedLanguages.includes('en')} />
					<label>English</label>
					<Toggle bind:checked={values.discover.includedLanguages.includes('fi')} />
					<label>Finnish</label> -->

					<h2>Filter based on language</h2>
					<Toggle bind:checked={values.discover.filterBasedOnLanguage} />
				</div>
			{/if}

			{#if openTab === 'integrations'}
				<div class="grid grid-cols-2 gap-4">
					<div
						class="border-b border-zinc-800 pb-4 mt-8 col-span-2 justify-self-stretch flex flex-col gap-2"
					>
						<h1 class="font-medium text-2xl text-zinc-200 tracking-wide">Integrations</h1>
						<p class="text-sm text-zinc-400">
							Note: Base urls must be accessible from the browser, meaning that internal docker
							addresses won't work, for example. API Keys <span class="font-medium underline"
								>will be exposed</span
							> to the browser.
						</p>
					</div>

					<div class="justify-self-stretch col-span-2 lg:col-span-1">
						<IntegrationCard
							title="Sonarr"
							href={$settings.sonarr.baseUrl || '#'}
							status={sonarrHealth === true ? 'connected' : 'disconnected'}
						>
							<div class="flex flex-col gap-1">
								<h2 class="text-sm text-zinc-500">Base URL</h2>
								<Input class="w-full" bind:value={values.sonarr.baseUrl} />
							</div>
							<div class="flex flex-col gap-1">
								<h2 class="text-sm text-zinc-500">API Key</h2>
								<Input class="w-full" bind:value={values.sonarr.apiKey} />
							</div>
							<FormButton
								type={getButtonType(sonarrHealth)}
								loading={sonarrHealth === 'loading'}
								disabled={sonarrHealth === 'loading'}
								on:click={handleSonarrHealthcheck}
							>
								Test Connection
							</FormButton>
						</IntegrationCard>
					</div>

					<div class="justify-self-stretch col-span-2 lg:col-span-1">
						<IntegrationCard
							title="Radarr"
							href={$settings.radarr.baseUrl || '#'}
							status={radarrHealth === true ? 'connected' : 'disconnected'}
						>
							<div class="flex flex-col gap-1">
								<h2 class="text-sm text-zinc-500">Base URL</h2>
								<Input class="w-full" bind:value={values.radarr.baseUrl} />
							</div>
							<div class="flex flex-col gap-1">
								<h2 class="text-sm text-zinc-500">API Key</h2>
								<Input class="w-full" bind:value={values.radarr.apiKey} />
							</div>
							<FormButton
								type={getButtonType(radarrHealth)}
								loading={radarrHealth === 'loading'}
								disabled={radarrHealth === 'loading'}
								on:click={handleRadarrHealthcheck}
							>
								Test Connection
							</FormButton>
						</IntegrationCard>
					</div>

					<div class="justify-self-stretch col-span-2 lg:col-span-1">
						<IntegrationCard
							title="Jellyfin"
							href={$settings.jellyfin.baseUrl || '#'}
							status={jellyfinHealth === true ? 'connected' : 'disconnected'}
						>
							<div class="flex flex-col gap-1">
								<h2 class="text-sm text-zinc-500">Base URL</h2>
								<Input class="w-full" bind:value={values.jellyfin.baseUrl} />
							</div>
							<div class="flex flex-col gap-1">
								<h2 class="text-sm text-zinc-500">API Key</h2>
								<Input class="w-full" bind:value={values.jellyfin.apiKey} />
							</div>
							<div class="flex flex-col gap-1">
								<h2 class="text-sm text-zinc-500">User</h2>
								{#if !jellyfinUsers}
									<Select disabled />
								{:else}
									<Select bind:value={values.jellyfin.userId}>
										{#each jellyfinUsers as user}
											<option value={user.id}>{user.name}</option>
										{/each}
									</Select>
								{/if}
							</div>
							<FormButton
								type={getButtonType(jellyfinHealth)}
								loading={jellyfinHealth === 'loading'}
								disabled={jellyfinHealth === 'loading'}
								on:click={handleJellyfinHealthcheck}
							>
								Test Connection
							</FormButton>
						</IntegrationCard>
					</div>
				</div>
			{/if}
		</div>
		<div class="flex items-center p-4 gap-8 justify-center text-zinc-500">
			<div>v{version}</div>
			<a target="_blank" href="https://github.com/aleksilassila/reiverr/releases">Changelog</a>
			<a target="_blank" href="https://github.com/aleksilassila/reiverr">GitHub</a>
		</div>
	</div>
</div>

<!-- Language settings -->
