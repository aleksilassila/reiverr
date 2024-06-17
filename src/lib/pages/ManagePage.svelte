<script lang="ts">
	import Container from '../../Container.svelte';
	import Button from '../components/Button.svelte';
	import Toggle from '../components/Toggle.svelte';
	import { localSettings } from '../stores/localstorage.store';
	import classNames from 'classnames';
	import Tab from '../components/Tab/Tab.svelte';
	import { useTabs } from '../components/Tab/Tab';
	import SonarrIntegration from '../components/Integrations/SonarrIntegration.svelte';
	import RadarrIntegration from '../components/Integrations/RadarrIntegration.svelte';
	import type { JellyfinUser } from '../apis/jellyfin/jellyfin-api';
	import JellyfinIntegration from '../components/Integrations/JellyfinIntegration.svelte';
	import JellyfinIntegrationUsersDialog from '../components/Integrations/JellyfinIntegrationUsersDialog.svelte';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import SelectField from '../components/SelectField.svelte';
	import { ArrowRight, Exit, Pencil1, Pencil2, Plus, Trash } from 'radix-icons-svelte';
	import TmdbIntegrationConnectDialog from '../components/Integrations/TmdbIntegrationConnectDialog.svelte';
	import { createModal } from '../components/Modal/modal.store';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import { user } from '../stores/user.store';
	import { sessions } from '../stores/session.store';
	import EditProfileModal from '../components/Dialog/CreateOrEditProfileModal.svelte';
	import { scrollIntoView } from '../selectable';
	import Panel from '../components/Panel.svelte';
	import { reiverrApi } from '../apis/reiverr/reiverr-api';

	enum Tabs {
		Interface,
		Account,
		About
	}

	const tab = useTabs(Tabs.Interface, { size: 'stretch' });

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
	$: tmdbAccount = $user?.settings.tmdb.userId ? tmdbApi.getAccountDetails() : undefined;
	let users = getUsers();

	function getUsers() {
		return $user?.isAdmin ? reiverrApi.getUsers() : undefined;
	}

	async function handleDisconnectTmdb() {
		return user.updateUser((prev) => ({
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
		return user.updateUser((prev) => ({
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
		return user.updateUser((prev) => ({
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
		return user.updateUser((prev) => ({
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

	function handleLogOut() {
		sessions.removeSession();
	}

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
</script>

<svelte:window
	on:keydown={(e) => {
		lastKeyCode = e.keyCode;
		lastKey = e.key;
	}}
/>

<DetachedPage class="px-32 py-16 h-screen flex flex-col">
	<Container
		direction="horizontal"
		class="flex space-x-8 header3 pb-3 border-b-2 border-secondary-700 w-full mb-8"
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
				Options
			</span>
		</Container>
		<Container
			on:enter={() => tab.set(Tabs.Account)}
			on:clickOrSelect={() => tab.set(Tabs.Account)}
			let:hasFocus
			focusOnClick
		>
			<span
				class={classNames('cursor-pointer', {
					'text-secondary-400': $tab !== Tabs.Account,
					'text-primary-500': hasFocus
				})}
			>
				Accounts
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

	<Container class="flex-1 grid w-full overflow-y-auto scrollbar-hide relative">
		<Tab {...tab} tab={Tabs.Interface} class="w-full">
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
			<div class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2">
				<label class="mr-2">Check for Updates</label>
				<Toggle
					checked={$localSettings.checkForUpdates}
					on:change={({ detail }) =>
						localSettings.update((p) => ({ ...p, checkForUpdates: detail }))}
				/>
			</div>
		</Tab>

		<Tab {...tab} tab={Tabs.Account} class="space-y-16">
			<div>
				<Container class="bg-primary-800 rounded-xl p-8" on:enter={scrollIntoView({ top: 9999 })}>
					<h1 class="header1 mb-4">My Profile</h1>
					<SelectField
						class="mb-4"
						value={$user?.name || ''}
						on:clickOrSelect={() => {
							const u = $user;
							if (u)
								createModal(EditProfileModal, {
									user: u
								});
						}}
					>
						Logged in as
						<Pencil2 slot="icon" let:size let:iconClass {size} class={classNames(iconClass)} />
					</SelectField>
					<Container direction="horizontal" class="flex space-x-4">
						<Button type="primary-dark" icon={Exit} on:clickOrSelect={handleLogOut}>Log Out</Button>
					</Container>
					{#await users then usersR}
						{#if usersR?.length}
							<div class="mt-8">
								<h1 class="header1 mb-4">Server Accounts</h1>
								<Container class="grid grid-cols-2 gap-4" direction="grid" gridCols={2}>
									{#each usersR.filter((u) => u.id !== $user?.id) as user}
										<SelectField
											value={user?.name || ''}
											on:clickOrSelect={() => {
												createModal(EditProfileModal, {
													user,
													admin: true,
													onComplete: () => (users = getUsers())
												});
											}}
										>
											{user.isAdmin ? 'Admin' : 'User'}
											<Pencil2
												slot="icon"
												let:size
												let:iconClass
												{size}
												class={classNames(iconClass)}
											/>
										</SelectField>
									{/each}
									<SelectField
										value="New Account"
										on:clickOrSelect={() => {
											createModal(EditProfileModal, {
												createNew: true,
												onComplete: () => (users = getUsers())
											});
										}}
									>
										Create
										<Plus slot="icon" let:size let:iconClass {size} class={classNames(iconClass)} />
									</SelectField>
								</Container>
							</div>
						{/if}
					{/await}
				</Container>
			</div>

			<div>
				<h1 class="font-semibold text-2xl text-secondary-100 mb-8">Integrations</h1>
				<Container direction="horizontal" class="gap-16 grid grid-cols-2">
					<Container class="flex flex-col space-y-16">
						<Container
							class="bg-primary-800 rounded-xl p-8"
							on:enter={scrollIntoView({ vertical: 64 })}
						>
							<h1 class="mb-4 header1">Sonarr</h1>
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

						<Container
							class="bg-primary-800 rounded-xl p-8"
							on:enter={scrollIntoView({ vertical: 64 })}
						>
							<h1 class="mb-4 header1">Radarr</h1>
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

					<Container class="flex flex-col space-y-16">
						<Container
							class="bg-primary-800 rounded-xl p-8"
							on:enter={scrollIntoView({ vertical: 64 })}
						>
							<h1 class="mb-4 header1">Tmdb Account</h1>
							{#await tmdbAccount then tmdbAccount}
								{#if tmdbAccount}
									<SelectField
										value={tmdbAccount.username || ''}
										action={handleDisconnectTmdb}
										class="mb-4"
									>
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
						</Container>

						<Container
							class="bg-primary-800 rounded-xl p-8"
							on:enter={scrollIntoView({ vertical: 64 })}
						>
							<h1 class="mb-4 header1">Jellyfin</h1>
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
			</div>
		</Tab>

		<Tab {...tab} tab={Tabs.About}>
			<div>
				Version: {REIVERR_VERSION}
			</div>
			User agent: {window?.navigator?.userAgent}
			<div>Last key code: {lastKeyCode}</div>
			<div>Last key: {lastKey}</div>
			{#if tizenMediaKey}
				<div>Tizen media key: {tizenMediaKey}</div>
			{/if}
			<div class="flex space-x-4 mt-4">
				<Button on:clickOrSelect={handleLogOut} class="hover:bg-red-500">Log Out</Button>
			</div>
		</Tab>
	</Container>
</DetachedPage>
