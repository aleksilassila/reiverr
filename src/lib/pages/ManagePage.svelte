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
	import { ArrowRight, Exit, Pencil2, Plus, Trash } from 'radix-icons-svelte';
	import TmdbIntegrationConnectDialog from '../components/Integrations/TmdbIntegrationConnectDialog.svelte';
	import { createModal } from '../components/Modal/modal.store';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import { user } from '../stores/user.store';
	import { sessions } from '../stores/session.store';
	import EditProfileModal from '../components/Dialog/CreateOrEditProfileModal.svelte';
	import { scrollIntoView } from '../selectable';
	import { reiverrApi } from '../apis/reiverr/reiverr-api';
	import TmdbIntegration from '../components/Integrations/TmdbIntegration.svelte';
	import { _ } from 'svelte-i18n';
	import LanguageSettings from '../components/LanguageSettings.svelte';

	enum Tabs {
		Interface,
		Account,
		About
	}

	const tab = useTabs(Tabs.Interface, { size: 'stretch' });

	let lastKeyCode = 0;
	let lastKey = '';
	let tizenMediaKey = '';
	$: tmdbAccount = $user?.settings.tmdb.userId ? tmdbApi.getAccountDetails() : undefined;
	let users = getUsers();

	function getUsers() {
		return $user?.isAdmin ? reiverrApi.getUsers() : undefined;
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

<DetachedPage class="pt-16 h-screen flex flex-col">
	<Container
		direction="horizontal"
		class="flex space-x-8 header3 pb-3 border-b-2 border-secondary-700 mb-8 mx-32"
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
			{$_('settings.accounts.accounts')}
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
			{$_('settings.navbar.about')}
			</span>
		</Container>
	</Container>

	<Container class="flex-1 grid w-full overflow-y-auto scrollbar-hide relative pb-16 px-32">
		<Tab {...tab} tab={Tabs.Interface} class="w-full">
			<div class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2">
				<label class="mr-2">{$_('settings.general.userInterface.animateScrolling')}</label>
				<Toggle
					checked={$localSettings.animateScrolling}
					on:change={({ detail }) =>
						localSettings.update((p) => ({ ...p, animateScrolling: detail }))}
				/>
			</div>
			<div class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2">
				<label class="mr-2">{$_('settings.general.userInterface.useCssTransitions')}</label>
				<Toggle
					checked={$localSettings.useCssTransitions}
					on:change={({ detail }) =>
						localSettings.update((p) => ({ ...p, useCssTransitions: detail }))}
				/>
			</div>
			<div class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2">
				<label class="mr-2">{$_('settings.general.userInterface.checkForUpdates')}</label>
				<Toggle
					checked={$localSettings.checkForUpdates}
					on:change={({ detail }) =>
						localSettings.update((p) => ({ ...p, checkForUpdates: detail }))}
				/>
			</div>


			<div class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2">
				<label class="mr-2">{$_('settings.general.userInterface.language')}</label>
				<LanguageSettings 
					on:change={({ detail }) => {
					console.log('Language changed to:', detail.language);
					}}
				/>
			</div>


		</Tab>

		<Tab {...tab} tab={Tabs.Account} class="space-y-16">
			<div>
				<Container class="bg-primary-800 rounded-xl p-8" on:enter={scrollIntoView({ top: 9999 })}>
					<h1 class="header1 mb-4">{$_('settings.accounts.myprofile')}</h1>
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
					{$_('settings.accounts.loginAs')}
						<Pencil2 slot="icon" let:size let:iconClass {size} class={classNames(iconClass)} />
					</SelectField>
					<Container direction="horizontal" class="flex space-x-4">
						<Button type="primary-dark" icon={Exit} on:clickOrSelect={handleLogOut}>{$_('settings.accounts.logOut')}</Button>
					</Container>
					{#await users then usersR}
						{#if usersR?.length}
							<div class="mt-8">
								<h1 class="header1 mb-4">{$_('settings.accounts.serverAccounts')}
								</h1>
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
										value="{$_('settings.accounts.newaccount')}"
										on:clickOrSelect={() => {
											createModal(EditProfileModal, {
												createNew: true,
												onComplete: () => (users = getUsers())
											});
										}}
									>
									{$_('settings.accounts.create')}
										<Plus slot="icon" let:size let:iconClass {size} class={classNames(iconClass)} />
									</SelectField>
								</Container>
							</div>
						{/if}
					{/await}
				</Container>
			</div>

			<div>
				<h1 class="font-semibold text-2xl text-secondary-100 mb-8">{$_('settings.navbar.integrations')}</h1>
				<Container direction="horizontal" class="gap-16 grid grid-cols-2">
					<Container class="flex flex-col space-y-16">
						<Container
							class="bg-primary-800 rounded-xl p-8"
							on:enter={scrollIntoView({ vertical: 64 })}
						>
							<h1 class="mb-4 header1">Sonarr</h1>
							<SonarrIntegration let:stale let:handleSave>
								<Button disabled={!stale} type="primary-dark" action={handleSave}>{$_('settings.integrations.save')}</Button>
							</SonarrIntegration>
						</Container>

						<Container
							class="bg-primary-800 rounded-xl p-8"
							on:enter={scrollIntoView({ vertical: 64 })}
						>
							<h1 class="mb-4 header1">Radarr</h1>
							<RadarrIntegration let:stale let:handleSave>
								<Button disabled={!stale} type="primary-dark" action={handleSave}>{$_('settings.integrations.save')}</Button>
							</RadarrIntegration>
						</Container>
					</Container>

					<Container class="flex flex-col space-y-16">
						<Container
							class="bg-primary-800 rounded-xl p-8"
							on:enter={scrollIntoView({ vertical: 64 })}
						>
							<h1 class="mb-4 header1">{$_('settings.accounts.newaccount')}</h1>
							<TmdbIntegration let:connected>
								{#if !connected}
									<div class="flex space-x-4 mt-4">
										<Button
											type="primary-dark"
											iconAfter={ArrowRight}
											on:clickOrSelect={() => createModal(TmdbIntegrationConnectDialog, {})}
										>
										{$_('settings.integrations.tmdb.connect')}
										</Button>
									</div>
								{/if}
							</TmdbIntegration>

							<!--{#await tmdbAccount then tmdbAccount}-->
							<!--	{#if tmdbAccount}-->
							<!--		<SelectField-->
							<!--			value={tmdbAccount.username || ''}-->
							<!--			action={handleDisconnectTmdb}-->
							<!--			class="mb-4"-->
							<!--		>-->
							<!--			Connected to-->
							<!--			<Trash-->
							<!--				slot="icon"-->
							<!--				let:size-->
							<!--				let:iconClass-->
							<!--				{size}-->
							<!--				class={classNames(iconClass, '')}-->
							<!--			/>-->
							<!--		</SelectField>-->
							<!--	{:else}-->
							<!--		<div class="flex space-x-4">-->
							<!--			<Button-->
							<!--				type="primary-dark"-->
							<!--				iconAfter={ArrowRight}-->
							<!--				on:clickOrSelect={() => createModal(TmdbIntegrationConnectDialog, {})}-->
							<!--				>Connect</Button-->
							<!--			>-->
							<!--		</div>-->
							<!--	{/if}-->
							<!--{/await}-->
						</Container>

						<Container
							class="bg-primary-800 rounded-xl p-8"
							on:enter={scrollIntoView({ vertical: 64 })}
						>
							<h1 class="mb-4 header1">Jellyfin</h1>
							<JellyfinIntegration
								on:click-user={({ detail }) =>
									createModal(JellyfinIntegrationUsersDialog, {
										selectedUser: detail.user,
										users: detail.users,
										handleSelectUser: detail.setJellyfinUser
									})}
								let:handleSave
								let:stale
							>
								<Button disabled={!stale} type="primary-dark" action={handleSave}>{$_('settings.integrations.save')}</Button>
							</JellyfinIntegration>
						</Container>
					</Container>
				</Container>
			</div>
		</Tab>

		<Tab {...tab} tab={Tabs.About}>
			<div>
				Version: {REIVERR_VERSION}
			</div>
			<div>
				Mode: {import.meta.env.MODE}
			</div>
			<div>
				meta.env: {JSON.stringify(import.meta.env)}
			</div>
			{$_('settings.about.userAgent')} {window?.navigator?.userAgent}
			<div>{$_('settings.about.lastKeyCode')} {lastKeyCode}</div>
			<div>{$_('settings.about.lastKey')} {lastKey}</div>
			{#if tizenMediaKey}
				<div>{$_('settings.about.tizenMediaKey')} {tizenMediaKey}</div>
			{/if}
			<div class="flex space-x-4 mt-4">
				<Button on:clickOrSelect={handleLogOut} class="hover:bg-red-500">{$_('settings.about.logOut')}</Button>
			</div>
		</Tab>
	</Container>
</DetachedPage>
