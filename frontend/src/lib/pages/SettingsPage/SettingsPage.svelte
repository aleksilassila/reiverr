<script lang="ts">
	import Container from '$components/Container.svelte';
	import TabContainer from '$lib/components/Tab/TabContainer.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import classNames from 'classnames';
	import { ArrowRight, Exit, Pencil2 } from 'radix-icons-svelte';
	import { tmdbApi } from '../../apis/tmdb/tmdb-api';
	import Button from '../../components/Button/Button.svelte';
	import EditProfileModal from '../../components/Dialog/CreateOrEditProfileModal.svelte';
	import TmdbIntegration from '../../components/Integrations/TmdbIntegration.svelte';
	import TmdbIntegrationConnectDialog from '../../components/Integrations/TmdbIntegrationConnectDialog.svelte';
	import { createModal } from '../../components/Modal/modal.store';
	import SelectField from '../../components/SelectField.svelte';
	import { useTabs } from '../../components/Tab/Tab';
	import Tab from '../../components/Tab/Tab.svelte';
	import TabSelect from '../../components/Tab/TabSelect.svelte';
	import Toggle from '../../components/Toggle.svelte';
	import { localSettings } from '../../stores/localstorage.store';
	import { sessions } from '../../stores/session.store';
	import { reiverrApi, user } from '../../stores/user.store';
	import Accounts from './Accounts.SettingsPage.svelte';
	import Downloads from './Downloads.SettingsPage.svelte';
	import Library from './Library.SettingsPage.svelte';

	enum Tabs {
		Account,
		Device,
		Server
	}

	const tab = useTabs(Tabs.Device, { direction: 'vertical', remount: false });

	let lastKeyCode = 0;
	let lastKey = '';
	const tizenMediaKey = '';
	$: tmdbAccount = $user?.settings.tmdb.userId ? tmdbApi.getAccountDetails() : undefined;

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

<Container class="flex flex-col pt-16 h-screen space-y-16 px-32" direction="horizontal">
	<div class="divider-lg pb-4 space-y-2">
		<h1 class="h1">Settings</h1>
		<p class="body">Manage your settings and integrations.</p>
	</div>
	<div class="flex-1 flex mx-auto h-full w-full max-w-7xl items-start space-x-16">
		<Container direction="vertical" class="space-y-4 h3 w-52 lg:w-72 flex flex-col *:flex-1">
			<TabSelect tabValue={Tabs.Account} openTab={tab.openTab} let:hasFocus let:isActive>
				<span
					class={classNames(
						'flex items-center cursor-pointer py-3 px-6 w-full rounded-xl',
						{
							'bg-secondary-800': isActive,
							'text-secondary-400': !isActive,
							'text-secondary-200': isActive && !hasFocus,
							'text-primary-500': hasFocus
						},
						$$restProps.class
					)}
				>
					Account
				</span>
			</TabSelect>
			<TabSelect tabValue={Tabs.Device} openTab={tab.openTab} let:hasFocus let:isActive>
				<span
					class={classNames(
						'flex items-center cursor-pointer py-3 px-6 w-full rounded-xl',
						{
							'bg-secondary-800': isActive,
							'text-secondary-400': !isActive,
							'text-secondary-200': isActive && !hasFocus,
							'text-primary-500': hasFocus
						},
						$$restProps.class
					)}
				>
					Device
				</span>
			</TabSelect>
			{#if $user?.isAdmin}
				<TabSelect tabValue={Tabs.Server} openTab={tab.openTab} let:hasFocus let:isActive>
					<span
						class={classNames(
							'flex items-center cursor-pointer py-3 px-6 w-full rounded-xl',
							{
								'bg-secondary-800': isActive,
								'text-secondary-400': !isActive,
								'text-secondary-200': isActive && !hasFocus,
								'text-primary-500': hasFocus
							},
							$$restProps.class
						)}
					>
						Server
					</span>
				</TabSelect>
			{/if}
		</Container>

		<TabContainer absolute>
			<Tab {...tab} tab={Tabs.Account} class="space-y-16 pb-16">
				<Container class="max-w-sm" on:enter={scrollIntoView({ top: 9999 })}>
					<h1 class="h3 mb-8">My Profile</h1>
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
						<Button icon={Exit} on:clickOrSelect={handleLogOut}>Log Out</Button>
					</Container>
				</Container>

				<Container class="max-w-sm" on:enter={scrollIntoView({ vertical: 64 })}>
					<h1 class="h3 mb-8">Tmdb Account</h1>
					<TmdbIntegration let:connected>
						{#if !connected}
							<div class="flex space-x-4">
								<Button
									iconAfter={ArrowRight}
									on:clickOrSelect={() => createModal(TmdbIntegrationConnectDialog, {})}
								>
									Connect
								</Button>
							</div>
						{/if}
					</TmdbIntegration>
				</Container>
			</Tab>

			<Tab {...tab} tab={Tabs.Device} class="space-y-16 pb-16">
				<Container on:enter={scrollIntoView({ top: 9999 })}>
					<p class="body mb-8">These options are saved on this device and only apply to it.</p>
					<div
						class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2"
					>
						<label class="mr-2">Animate scrolling</label>
						<Toggle
							checked={$localSettings.animateScrolling}
							on:change={({ detail }) =>
								localSettings.update((p) => ({ ...p, animateScrolling: detail }))}
						/>
					</div>
					<div
						class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2"
					>
						<label class="mr-2">Use CSS Transitions</label>
						<Toggle
							checked={$localSettings.useCssTransitions}
							on:change={({ detail }) =>
								localSettings.update((p) => ({ ...p, useCssTransitions: detail }))}
						/>
					</div>
					<div
						class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2"
					>
						<label class="mr-2">Check for Updates</label>
						<Toggle
							checked={$localSettings.checkForUpdates}
							on:change={({ detail }) =>
								localSettings.update((p) => ({ ...p, checkForUpdates: detail }))}
						/>
					</div>
					<div
						class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2"
					>
						<label class="mr-2">Enable Trailers</label>
						<Toggle
							checked={$localSettings.enableTrailers}
							on:change={({ detail }) =>
								localSettings.update((p) => ({ ...p, enableTrailers: detail }))}
						/>
					</div>
					<div
						class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2"
					>
						<label class="mr-2">Autoplay Trailers</label>
						<Toggle
							checked={$localSettings.autoplayTrailers}
							on:change={({ detail }) =>
								localSettings.update((p) => ({ ...p, autoplayTrailers: detail }))}
						/>
					</div>
				</Container>

				<div>
					<h1 class="h3 mb-8">About</h1>
					<div>
						Version: {REIVERR_VERSION}
					</div>
					<div>
						Mode: {import.meta.env.MODE}
					</div>
					<div>
						Platform: {import.meta.env.VITE_PLATFORM ?? 'web'}
					</div>
					<div>
						meta.env: {JSON.stringify(import.meta.env, null, 2)}
					</div>
					User agent: {window?.navigator?.userAgent}
					<div>Last key code: {lastKeyCode}</div>
					<div>Last key: {lastKey}</div>
					{#if tizenMediaKey}
						<div>Tizen media key: {tizenMediaKey}</div>
					{/if}
					<div class="flex flex-col items-start space-y-4 mt-4">
						<Button
							on:clickOrSelect={handleLogOut}
							on:enter={scrollIntoView({ vertical: 128 })}
							class="hover:bg-red-500"
						>
							Log Out
						</Button>
					</div>
				</div>
			</Tab>

			{#if $user?.isAdmin}
				<Tab {...tab} tab={Tabs.Server} class="space-y-16 pb-16">
					<Accounts />

					<Downloads />

					<Library />

					<div>
						<h1 class="h3 mb-8">Metadata</h1>
						<Button
							action={() => reiverrApi.metadata.clearCache()}
							on:enter={scrollIntoView({ vertical: 128 })}
						>
							Clear TMDB Cache
						</Button>
					</div>
				</Tab>
			{/if}
		</TabContainer>
	</div>
</Container>
