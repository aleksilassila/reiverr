<script lang="ts">
	import Container from '$components/Container.svelte';
	import TabContainer from '$lib/components/Tab/TabContainer.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import classNames from 'classnames';
	import { ArrowRight, Exit, Pencil2, Plus } from 'radix-icons-svelte';
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
	import MediaSources from './MediaSources.ManagePage.svelte';

	enum Tabs {
		Account,
		Interface,
		About
	}

	const tab = useTabs(Tabs.Interface, { direction: 'vertical', remount: false });

	let lastKeyCode = 0;
	let lastKey = '';
	let tizenMediaKey = '';
	$: tmdbAccount = $user?.settings.tmdb.userId ? tmdbApi.getAccountDetails() : undefined;
	let users = getUsers();

	function getUsers() {
		return $user?.isAdmin ? reiverrApi.users.findAllUsers().then((r) => r.data) : undefined;
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

<Container class="flex flex-col pt-16 h-screen space-y-16 px-32" direction="horizontal">
	<div class="border-b-2 border-secondary-700 pb-4 space-y-2">
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
			<TabSelect tabValue={Tabs.Interface} openTab={tab.openTab} let:hasFocus let:isActive>
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
					Options
				</span>
			</TabSelect>
			<TabSelect tabValue={Tabs.About} openTab={tab.openTab} let:hasFocus let:isActive>
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
					About
				</span>
			</TabSelect>
		</Container>

		<TabContainer absolute>
			<Tab {...tab} tab={Tabs.Account} class="space-y-16 pb-16">
				<div>
					<Container class="bg-primary-800 rounded-xl p-8" on:enter={scrollIntoView({ top: 9999 })}>
						<h1 class="h4 mb-4">My Profile</h1>
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
							<Button type="primary-dark" icon={Exit} on:clickOrSelect={handleLogOut}>
								Log Out
							</Button>
						</Container>
						{#await users then usersR}
							{#if usersR?.length}
								<div class="mt-8">
									<h1 class="h4 mb-4">Server Accounts</h1>
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
											<Plus
												slot="icon"
												let:size
												let:iconClass
												{size}
												class={classNames(iconClass)}
											/>
										</SelectField>
									</Container>
								</div>
							{/if}
						{/await}
					</Container>
				</div>

				<MediaSources />

				<div>
					<h1 class="font-semibold text-2xl text-secondary-100 mb-8">Integrations</h1>
					<!-- <Container direction="horizontal" class="gap-16 grid grid-cols-2"> -->
					<!-- <Container class="flex flex-col space-y-16">
							<Container
								class="bg-primary-800 rounded-xl p-8"
								on:enter={scrollIntoView({ vertical: 64 })}
							>
								<h1 class="mb-4 h4">Sonarr</h1>
								<SonarrIntegration let:stale let:handleSave>
									<Button disabled={!stale} type="primary-dark" action={handleSave}>Save</Button>
								</SonarrIntegration>
							</Container>

							<Container
								class="bg-primary-800 rounded-xl p-8"
								on:enter={scrollIntoView({ vertical: 64 })}
							>
								<h1 class="mb-4 h4">Radarr</h1>
								<RadarrIntegration let:stale let:handleSave>
									<Button disabled={!stale} type="primary-dark" action={handleSave}>Save</Button>
								</RadarrIntegration>
							</Container>
						</Container> -->

					<!-- <Container class="flex flex-col space-y-16"> -->
					<Container
						class="bg-primary-800 rounded-xl p-8 max-w-sm"
						on:enter={scrollIntoView({ vertical: 64 })}
					>
						<h1 class="mb-4 h4">Tmdb Account</h1>
						<TmdbIntegration let:connected>
							{#if !connected}
								<div class="flex space-x-4 mt-4">
									<Button
										type="primary-dark"
										iconAfter={ArrowRight}
										on:clickOrSelect={() => createModal(TmdbIntegrationConnectDialog, {})}
									>
										Connect
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
						<!-- </Container> -->

						<!-- <Container
								class="bg-primary-800 rounded-xl p-8"
								on:enter={scrollIntoView({ vertical: 64 })}
							>
								<h1 class="mb-4 h4">Jellyfin</h1>
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
									<Button disabled={!stale} type="primary-dark" action={handleSave}>Save</Button>
								</JellyfinIntegration>
							</Container> -->
					</Container>
					<!-- </Container> -->
				</div>
			</Tab>

			<Tab {...tab} tab={Tabs.Interface}>
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
				<div class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2">
					<label class="mr-2">Enable Trailers</label>
					<Toggle
						checked={$localSettings.enableTrailers}
						on:change={({ detail }) =>
							localSettings.update((p) => ({ ...p, enableTrailers: detail }))}
					/>
				</div>
				<div class="flex items-center justify-between text-lg font-medium text-secondary-100 py-2">
					<label class="mr-2">Autoplay Trailers</label>
					<Toggle
						checked={$localSettings.autoplayTrailers}
						on:change={({ detail }) =>
							localSettings.update((p) => ({ ...p, autoplayTrailers: detail }))}
					/>
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
					<Button action={() => reiverrApi.metadata.clearCache()}>Clear TMDB Cache</Button>
					<Button on:clickOrSelect={handleLogOut} class="hover:bg-red-500">Log Out</Button>
				</div>
			</Tab>
		</TabContainer>
	</div>
</Container>
