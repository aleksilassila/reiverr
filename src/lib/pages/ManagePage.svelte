<script lang="ts">
	import Container from '../../Container.svelte';
	import { appState } from '../stores/app-state.store';
	import Button from '../components/Button.svelte';
	import Toggle from '../components/Toggle.svelte';
	import { localSettings } from '../stores/localstorage.store';
	import classNames from 'classnames';
	import Tab from '../components/Tab/Tab.svelte';
	import { useTabs } from '../components/Tab/Tab';
	import TextField from '../components/TextField.svelte';
	import SonarrIntegration from '../components/Integrations/SonarrIntegration.svelte';
	import RadarrIntegration from '../components/Integrations/RadarrIntegration.svelte';
	import type { JellyfinUser } from '../apis/jellyfin/jellyfin-api';
	import JellyfinIntegration from '../components/Integrations/JellyfinIntegration.svelte';
	import JellyfinIntegrationUsersDialog from '../components/Integrations/JellyfinIntegrationUsersDialog.svelte';
	import TmdbIntegration from '../components/Integrations/TmdbIntegration.svelte';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import SelectField from '../components/SelectField.svelte';
	import { ArrowRight, Trash } from 'radix-icons-svelte';
	import TmdbIntegrationConnectDialog from '../components/Integrations/TmdbIntegrationConnectDialog.svelte';
	import { createModal } from '../components/Modal/modal.store';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';

	enum Tabs {
		Interface,
		Integrations,
		About
	}

	const tab = useTabs(Tabs.Integrations);

	let jellyfinBaseUrl = '';
	let jellyfinApiKey = '';
	let jellyfinStale = false;
	let jellyfinUser: JellyfinUser | undefined = undefined;

	let sonarrBaseUrl = '';
	let sonarrApiKey = '';
	let sonarrStale = false;

	let radarrBaseUrl = '';
	let radarrApiKey = '';
	let radarrStale = false;

	let lastKeyCode = 0;
	let lastKey = '';
	let tizenMediaKey = '';
	$: tmdbAccount = $appState.user?.settings.tmdb.userId ? tmdbApi.getAccountDetails() : undefined;

	// onMount(() => {
	// 	if (isTizen()) {
	// 		const myMediaKeyChangeListener = {
	// 			onpressed: function (key: string) {
	// 				console.log('Pressed key: ' + key);
	// 				tizenMediaKey = key;
	// 			}
	// 		};
	//
	// 		// eslint-disable-next-line no-undef
	// 		tizen?.tvinputdevice?.registerKey?.('MediaPlayPause');
	// 		(tizen as any)?.mediakey?.setMediaKeyEventListener?.(myMediaKeyChangeListener);
	// 	}
	// });

	async function handleDisconnectTmdb() {
		return appState.updateUser((prev) => ({
			...prev,
			settings: {
				...prev.settings,
				tmdb: {
					...prev.settings.tmdb,
					userId: '',
					sessionId: ''
				}
			}
		}));
	}

	async function handleSaveJellyfin() {
		return appState.updateUser((prev) => ({
			...prev,
			settings: {
				...prev.settings,
				jellyfin: {
					...prev.settings.jellyfin,
					baseUrl: jellyfinBaseUrl,
					apiKey: jellyfinApiKey,
					userId: jellyfinUser?.Id ?? ''
				}
			}
		}));
	}

	async function handleSaveSonarr() {
		return appState.updateUser((prev) => ({
			...prev,
			settings: {
				...prev.settings,
				sonarr: {
					...prev.settings.sonarr,
					baseUrl: sonarrBaseUrl,
					apiKey: sonarrApiKey
				}
			}
		}));
	}

	async function handleSaveRadarr() {
		return appState.updateUser((prev) => ({
			...prev,
			settings: {
				...prev.settings,
				radarr: {
					...prev.settings.radarr,
					baseUrl: radarrBaseUrl,
					apiKey: radarrApiKey
				}
			}
		}));
	}
</script>

<svelte:window
	on:keydown={(e) => {
		console.log('keypress', e);
		lastKeyCode = e.keyCode;
		lastKey = e.key;
	}}
/>

<DetachedPage class="px-32 py-16">
	<Container
		direction="horizontal"
		class="flex space-x-8 header2 pb-3 border-b-2 border-secondary-700 w-full mb-8"
	>
		<Container
			on:enter={() => tab.set(Tabs.Interface)}
			on:clickOrSelect={() => tab.set(Tabs.Interface)}
			let:hasFocus
			focusOnClick
		>
			<span
				class={classNames('cursor-pointer', {
					'text-secondary-400': $tab !== Tabs.Interface,
					'text-primary-500': hasFocus
				})}
			>
				Interface
			</span>
		</Container>
		<Container
			on:enter={() => tab.set(Tabs.Integrations)}
			on:clickOrSelect={() => tab.set(Tabs.Integrations)}
			let:hasFocus
			focusOnClick
		>
			<span
				class={classNames('cursor-pointer', {
					'text-secondary-400': $tab !== Tabs.Integrations,
					'text-primary-500': hasFocus
				})}
			>
				Integrations
			</span>
		</Container>
		<Container
			on:enter={() => tab.set(Tabs.About)}
			on:clickOrSelect={() => tab.set(Tabs.About)}
			let:hasFocus
			focusOnClick
		>
			<span
				class={classNames('cursor-pointer', {
					'text-secondary-400': $tab !== Tabs.About,
					'text-primary-500': hasFocus
				})}
			>
				About
			</span>
		</Container>
	</Container>

	<Container class="grid">
		<Tab {...tab} tab={Tabs.Interface} class="">
			<div class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2">
				<label class="mr-2">Animate scrolling</label>
				<Toggle
					checked={$localSettings.animateScrolling}
					on:change={({ detail }) =>
						localSettings.update((p) => ({ ...p, animateScrolling: detail }))}
				/>
			</div>
			<div class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2">
				<label class="mr-2">Use CSS Transitions</label>
				<Toggle
					checked={$localSettings.useCssTransitions}
					on:change={({ detail }) =>
						localSettings.update((p) => ({ ...p, useCssTransitions: detail }))}
				/>
			</div>
		</Tab>

		<Tab {...tab} tab={Tabs.Integrations} class="">
			<Container direction="horizontal" class="gap-8 grid grid-cols-2">
				<Container class="flex flex-col space-y-8">
					<Container class="bg-primary-800 rounded-xl p-8">
						<h1 class="mb-4 header2">Sonarr</h1>
						<SonarrIntegration
							on:change={({ detail }) => {
								sonarrBaseUrl = detail.baseUrl;
								sonarrApiKey = detail.apiKey;
								sonarrStale = detail.stale;
							}}
						/>
						<div class="flex">
							<Button disabled={!sonarrStale} type="primary-dark" action={handleSaveSonarr}>
								Save
							</Button>
						</div>
					</Container>

					<Container class="bg-primary-800 rounded-xl p-8">
						<h1 class="mb-4 header2">Radarr</h1>
						<RadarrIntegration
							on:change={({ detail }) => {
								radarrBaseUrl = detail.baseUrl;
								radarrApiKey = detail.apiKey;
								radarrStale = detail.stale;
							}}
						/>
						<div class="flex">
							<Button disabled={!radarrStale} type="primary-dark" action={handleSaveRadarr}>
								Save
							</Button>
						</div>
					</Container>
				</Container>

				<Container class="flex flex-col space-y-8">
					<Container class="bg-primary-800 rounded-xl p-8">
						<h1 class="mb-4 header2">Tmdb Account</h1>
						{#await tmdbAccount then tmdbAccount}
							{#if tmdbAccount}
								<SelectField value={tmdbAccount.username || ''} action={handleDisconnectTmdb}>
									Connected to
									<Trash
										slot="icon"
										let:size
										let:iconClass
										{size}
										class={classNames(iconClass, '')}
									/>
								</SelectField>
							{:else}
								<div class="flex space-x-4">
									<Button
										type="primary-dark"
										iconAfter={ArrowRight}
										on:clickOrSelect={() => createModal(TmdbIntegrationConnectDialog, {})}
										>Connect</Button
									>
								</div>
							{/if}
						{/await}
						<!--					<TmdbIntegration-->
						<!--						on:change={({ detail }) => {-->
						<!--							sonarrBaseUrl = detail.baseUrl;-->
						<!--							sonarrApiKey = detail.apiKey;-->
						<!--							sonarrStale = detail.stale;-->
						<!--						}}-->
						<!--					/>-->
						<!--					<div class="flex">-->
						<!--						<Button disabled={!sonarrStale} type="primary-dark" action={handleSaveSonarr}>-->
						<!--							Save-->
						<!--						</Button>-->
						<!--					</div>-->
					</Container>

					<Container class="bg-primary-800 rounded-xl p-8">
						<h1 class="mb-4 header2">Jellyfin</h1>
						<JellyfinIntegration
							bind:jellyfinUser
							on:change={({ detail }) => {
								jellyfinBaseUrl = detail.baseUrl;
								jellyfinApiKey = detail.apiKey;
								jellyfinStale = detail.stale;
							}}
							on:click-user={({ detail }) =>
								createModal(JellyfinIntegrationUsersDialog, {
									selectedUser: detail.user,
									users: detail.users,
									handleSelectUser: (u) => (jellyfinUser = u)
								})}
						/>
						<div class="flex">
							<Button disabled={!jellyfinStale} type="primary-dark" action={handleSaveJellyfin}>
								Save
							</Button>
						</div>
					</Container>
				</Container>
			</Container>
		</Tab>

		<Tab {...tab} tab={Tabs.About}>
			User agent: {window?.navigator?.userAgent}
			<div>Last key code: {lastKeyCode}</div>
			<div>Last key: {lastKey}</div>
			{#if tizenMediaKey}
				<div>Tizen media key: {tizenMediaKey}</div>
			{/if}
			<div class="flex space-x-4 mt-4">
				<Button on:clickOrSelect={appState.logOut} class="hover:bg-red-500">Log Out</Button>
			</div>
		</Tab>
	</Container>
</DetachedPage>
