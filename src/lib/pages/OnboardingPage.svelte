<script lang="ts">
	import Container from '../../Container.svelte';
	import Tab from '../components/Tab/Tab.svelte';
	import Button from '../components/Button.svelte';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import { ArrowLeft, ArrowRight, CheckCircled, ExternalLink } from 'radix-icons-svelte';
	import TextField from '../components/TextField.svelte';
	import { jellyfinApi, type JellyfinUser } from '../apis/jellyfin/jellyfin-api';
	import SelectField from '../components/SelectField.svelte';
	import SelectItem from '../components/SelectItem.svelte';
	import { sonarrApi } from '../apis/sonarr/sonarr-api';
	import { radarrApi } from '../apis/radarr/radarr-api';
	import { useTabs } from '../components/Tab/Tab';
	import classNames from 'classnames';
	import { user } from '../stores/user.store';
	import { sessions } from '../stores/session.store';
	import Panel from '../components/Panel.svelte';
	import TmdbIntegrationConnect from '../components/Integrations/TmdbIntegrationConnect.svelte';
	import JellyfinIntegration from '../components/Integrations/JellyfinIntegration.svelte';
	import SonarrIntegration from '../components/Integrations/SonarrIntegration.svelte';
	import RadarrIntegration from '../components/Integrations/RadarrIntegration.svelte';
	import TmdbIntegration from '../components/Integrations/TmdbIntegration.svelte';

	enum Tabs {
		Welcome,
		Tmdb,
		Jellyfin,
		Sonarr,
		Radarr,
		Complete,

		SelectUser = Jellyfin + 0.1,
		TmdbConnect = Tmdb + 0.1
	}

	const tab = useTabs(Tabs.Welcome, { ['class']: 'w-max max-w-lg' });

	$: connectedTmdbAccount = $user?.settings.tmdb.userId && tmdbApi.getAccountDetails();

	let jellyfinUser: JellyfinUser | undefined = undefined;
	let jellyfinUsers: Promise<JellyfinUser[]> = Promise.resolve([]);

	async function finalizeSetup() {
		await user.updateUser((prev) => ({
			...prev,
			onboardingDone: true
		}));
	}

	function handleBack() {
		tab.previous();
	}
</script>

<Container focusOnMount class="h-full w-full flex items-center justify-center" on:back={handleBack}>
	<Panel class="grid max-w-lg" size="dynamic">
		<Tab {...tab} tab={Tabs.Welcome} on:back={({ detail }) => detail.stopPropagation()}>
			<h1 class="header2 mb-2 w-full">Welcome to Reiverr</h1>
			<div class="body mb-8">
				Looks like this is a new account. This setup will get you started with connecting your
				services to get most out of Reiverr.
			</div>
			<Container direction="horizontal" class="flex space-x-4 *:flex-1">
				<Button type="primary-dark" on:clickOrSelect={() => sessions.removeSession()}
					>Log Out</Button
				>
				<Button
					focusOnMount
					type="primary-dark"
					on:clickOrSelect={() => tab.next()}
					iconAbsolute={ArrowRight}
				>
					Next
				</Button>
			</Container>
		</Tab>

		<Tab {...tab} tab={Tabs.Tmdb}>
			<h1 class="header2 mb-2">Connect a TMDB Account</h1>
			<div class="body mb-8">
				Connect to TMDB for personalized recommendations based on your movie reviews and
				preferences.
			</div>

			<TmdbIntegration handleConnectTmdb={() => tab.set(Tabs.TmdbConnect)} let:connected>
				{#if !connected}
					{#if !$user?.settings.tmdb.userId}
						<Button
							type="primary-dark"
							on:clickOrSelect={() => {
								tab.set(Tabs.TmdbConnect);
							}}
						>
							Connect
						</Button>
					{/if}
				{/if}
				<Container direction="horizontal" class="flex space-x-4 *:flex-1 mt-4">
					<Button type="primary-dark" on:clickOrSelect={() => tab.previous()}>Back</Button>
					<Button focusedChild type="primary-dark" on:clickOrSelect={() => tab.next()}>
						{#if connected}
							Next
						{:else}
							Skip
						{/if}
					</Button>
				</Container>
			</TmdbIntegration>

			<!--			<div class="space-y-4 flex flex-col">-->
			<!--				{#await connectedTmdbAccount then account}-->
			<!--					{#if account}-->
			<!--						<SelectField-->
			<!--							class="mb-4"-->
			<!--							value={account.username || ''}-->
			<!--							on:clickOrSelect={() => {-->
			<!--								tab.set(Tabs.TmdbConnect);-->
			<!--							}}>Logged in as</SelectField-->
			<!--						>-->
			<!--					{:else}-->
			<!--						<Button-->
			<!--							type="primary-dark"-->
			<!--							on:clickOrSelect={() => {-->
			<!--								tab.set(Tabs.TmdbConnect);-->
			<!--							}}-->
			<!--						>-->
			<!--							Connect-->
			<!--							<ArrowRight size={19} slot="icon-absolute" />-->
			<!--						</Button>-->
			<!--					{/if}-->
			<!--				{/await}-->
			<!--			</div>-->
		</Tab>

		<Tab
			{...tab}
			tab={Tabs.TmdbConnect}
			on:back={({ detail }) => {
				tab.set(Tabs.Tmdb);
				detail.stopPropagation();
			}}
		>
			<TmdbIntegrationConnect on:connected={() => tab.set(Tabs.Jellyfin)} />
		</Tab>

		<Tab {...tab} tab={Tabs.Jellyfin}>
			<h1 class="header2 mb-2">Connect to Jellyfin</h1>
			<div class="mb-8 body">Connect to Jellyfin to watch movies and tv shows.</div>

			<JellyfinIntegration
				bind:jellyfinUser
				bind:jellyfinUsers
				on:click-user={() => tab.set(Tabs.SelectUser)}
				let:handleSave
				let:stale
				let:empty
				let:unchanged
			>
				<Container direction="horizontal" class="grid grid-cols-2 gap-4 mt-4">
					<Button type="primary-dark" on:clickOrSelect={() => tab.previous()}>Back</Button>
					{#if empty || unchanged}
						<Button focusedChild type="primary-dark" on:clickOrSelect={() => tab.next()}>
							{empty ? 'Skip' : 'Next'}
						</Button>
					{:else}
						<Button
							type="primary-dark"
							disabled={!stale}
							action={() => handleSave().then(tab.next)}
						>
							Connect
						</Button>
					{/if}
				</Container>
			</JellyfinIntegration>

			<!--			<div class="space-y-4 mb-4">-->
			<!--				<TextField bind:value={jellyfinBaseUrl} isValid={jellyfinUsers.then((u) => !!u?.length)}>-->
			<!--					Base Url-->
			<!--				</TextField>-->
			<!--				<TextField bind:value={jellyfinApiKey} isValid={jellyfinUsers.then((u) => !!u?.length)}>-->
			<!--					API Key-->
			<!--				</TextField>-->
			<!--			</div>-->

			<!--			{#await jellyfinUsers then users}-->
			<!--				{#if users.length}-->
			<!--					<SelectField-->
			<!--						value={jellyfinUser?.Name || 'Select User'}-->
			<!--						on:clickOrSelect={() => tab.set(Tabs.SelectUser)}-->
			<!--						class="mb-4"-->
			<!--					>-->
			<!--						User-->
			<!--					</SelectField>-->
			<!--				{/if}-->
			<!--			{/await}-->

			<!--			{#if jellyfinError}-->
			<!--				<div class="text-red-500 mb-4">{jellyfinError}</div>-->
			<!--			{/if}-->
		</Tab>
		<Tab
			{...tab}
			tab={Tabs.SelectUser}
			on:back={({ detail }) => {
				tab.set(Tabs.Jellyfin);
				detail.stopPropagation();
			}}
		>
			<h1 class="header1 mb-2 w-96">Select User</h1>
			<div class="flex flex-col space-y-4" />
			{#await jellyfinUsers then users}
				{#each users || [] as user}
					<SelectItem
						selected={user?.Id === jellyfinUser?.Id}
						on:clickOrSelect={() => {
							jellyfinUser = user;
							tab.set(Tabs.Jellyfin);
						}}
					>
						{user.Name}
					</SelectItem>
				{/each}
			{/await}
		</Tab>

		<Tab {...tab} tab={Tabs.Sonarr}>
			<h1 class="header2 mb-2">Connect to Sonarr</h1>
			<div class="mb-8">Connect to Sonarr for requesting and managing tv shows.</div>

			<SonarrIntegration let:stale let:handleSave let:empty let:unchanged>
				<Container direction="horizontal" class="grid grid-cols-2 gap-4 mt-4">
					<Button type="primary-dark" on:clickOrSelect={() => tab.previous()}>Back</Button>
					{#if empty || unchanged}
						<Button focusedChild type="primary-dark" on:clickOrSelect={() => tab.next()}>
							{empty ? 'Skip' : 'Next'}
						</Button>
					{:else}
						<Button
							type="primary-dark"
							disabled={!stale}
							action={() => handleSave().then(tab.next)}
						>
							Connect
						</Button>
					{/if}
				</Container>
			</SonarrIntegration>
		</Tab>

		<Tab {...tab} tab={Tabs.Radarr}>
			<h1 class="header2 mb-2">Connect to Radarr</h1>
			<div class="mb-8">Connect to Radarr for requesting and managing movies.</div>

			<RadarrIntegration let:stale let:handleSave let:empty let:unchanged>
				<Container direction="horizontal" class="grid grid-cols-2 gap-4 mt-4">
					<Button type="primary-dark" on:clickOrSelect={() => tab.previous()}>Back</Button>
					{#if empty || unchanged}
						<Button focusedChild type="primary-dark" on:clickOrSelect={() => tab.next()}>
							{empty ? 'Skip' : 'Next'}
						</Button>
					{:else}
						<Button
							type="primary-dark"
							disabled={!stale}
							action={() => handleSave().then(tab.next)}
						>
							Connect
						</Button>
					{/if}
				</Container>
			</RadarrIntegration>
		</Tab>

		<Tab {...tab} tab={Tabs.Complete} class={classNames('w-full')}>
			<div class="flex items-center justify-center text-secondary-500 mb-4">
				<CheckCircled size={64} />
			</div>
			<h1 class="header2 text-center w-full">All Set!</h1>
			<div class="body mb-8 text-center">Reiverr is now ready to use.</div>

			<Container direction="horizontal" class="inline-flex space-x-4 w-full">
				<Button type="primary-dark" on:clickOrSelect={() => tab.previous()} icon={ArrowLeft}>
					Back
				</Button>
				<div class="flex-1">
					<Button
						focusedChild
						type="primary-dark"
						on:clickOrSelect={finalizeSetup}
						iconAbsolute={ArrowRight}
					>
						Done
					</Button>
				</div>
			</Container>
		</Tab>
	</Panel>
</Container>
