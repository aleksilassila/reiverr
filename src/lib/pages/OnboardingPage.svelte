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

	let tmdbConnectRequestToken: string | undefined = undefined;
	let tmdbConnectLink: string | undefined = undefined;
	let tmdbConnectQrCode: string | undefined = undefined;
	$: connectedTmdbAccount = $user?.settings.tmdb.userId && tmdbApi.getAccountDetails();
	let tmdbError: string = '';

	let jellyfinBaseUrl: string = '';
	let jellyfinApiKey: string = '';
	let jellyfinUser: JellyfinUser | undefined = undefined;
	let jellyfinUsers: Promise<JellyfinUser[]> = Promise.resolve([]);
	let jellyfinConnectionCheckTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
	let jellyfinError: string = '';

	let sonarrBaseUrl: string = '';
	let sonarrApiKey: string = '';
	let sonarrError: string = '';

	let radarrBaseUrl: string = '';
	let radarrApiKey: string = '';
	let radarrError: string = '';

	user.subscribe((user) => {
		jellyfinBaseUrl = jellyfinBaseUrl || user?.settings.jellyfin.baseUrl || '';
		jellyfinApiKey = jellyfinApiKey || user?.settings.jellyfin.apiKey || '';

		sonarrBaseUrl = sonarrBaseUrl || user?.settings.sonarr.baseUrl || '';
		sonarrApiKey = sonarrApiKey || user?.settings.sonarr.apiKey || '';

		radarrBaseUrl = radarrBaseUrl || user?.settings.radarr.baseUrl || '';
		radarrApiKey = radarrApiKey || user?.settings.radarr.apiKey || '';

		// if (
		// 	!jellyfinUser &&
		// 	appState.user?.settings.jellyfin.userId &&
		// 	jellyfinBaseUrl &&
		// 	jellyfinApiKey
		// ) {
		// 	jellyfinUsers = jellyfinApi.getJellyfinUsers(jellyfinBaseUrl, jellyfinApiKey);
		// 	jellyfinUsers.then(
		// 		(users) =>
		// 			(jellyfinUser = users.find((u) => u.Id === appState.user?.settings.jellyfin.userId))
		// 	);
		// }
	});

	$: if (jellyfinBaseUrl && jellyfinApiKey) {
		clearTimeout(jellyfinConnectionCheckTimeout);

		const baseUrlCopy = jellyfinBaseUrl;
		const apiKeyCopy = jellyfinApiKey;
		jellyfinUser = undefined;

		jellyfinConnectionCheckTimeout = setTimeout(async () => {
			jellyfinUsers = jellyfinApi
				.getJellyfinUsers(jellyfinBaseUrl, jellyfinApiKey)
				.then((users) => {
					if (baseUrlCopy === jellyfinBaseUrl && apiKeyCopy === jellyfinApiKey) {
						jellyfinUser = users.find((u) => u.Id === $user?.settings.jellyfin.userId);
						jellyfinError = users.length ? '' : 'Could not connect';
					}
					// console.log(users, baseUrlCopy, jellyfinBaseUrl, apiKeyCopy, jellyfinApiKey);
					// jellyfinUsers = users;
					// return !!users?.length;
					return users;
				});
		}, 500);
	}

	async function handleGenerateTMDBLink() {
		return tmdbApi.getConnectAccountLink().then((res) => {
			if (res?.status_code !== 1) return; // TODO add notification
			const link = `https://www.themoviedb.org/auth/access?request_token=${res?.request_token}`;
			const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${link}`;
			tmdbConnectRequestToken = res?.request_token;
			tmdbConnectLink = link;
			tmdbConnectQrCode = qrCode;
		});
	}

	async function completeTMDBConnect() {
		if (!tmdbConnectRequestToken) return;
		tmdbApi.getAccountAccessToken(tmdbConnectRequestToken).then((res) => {
			const { status_code, access_token, account_id } = res || {};
			if (status_code !== 1 || !access_token || !account_id) return; // TODO add notification

			user.updateUser((prev) => ({
				...prev,
				settings: {
					...prev.settings,
					tmdb: {
						userId: account_id,
						sessionId: access_token
					}
				}
			}));

			tab.set(Tabs.Jellyfin);
		});
	}

	async function handleConnectJellyfin() {
		const userId = jellyfinUser?.Id;
		const baseUrl = jellyfinBaseUrl;
		const apiKey = jellyfinApiKey;
		if (!userId || !baseUrl || !apiKey) return;

		await user.updateUser((prev) => ({
			...prev,
			settings: {
				...prev.settings,
				jellyfin: {
					...prev.settings.jellyfin,
					userId,
					baseUrl,
					apiKey
				}
			}
		}));

		tab.next();
	}

	async function handleConnectSonarr() {
		const baseUrl = sonarrBaseUrl;
		const apiKey = sonarrApiKey;
		if (!baseUrl || !apiKey) return;
		const res = await sonarrApi.getHealth(baseUrl, apiKey);

		if (res.status !== 200) {
			sonarrError =
				res.status === 404
					? 'Server not found'
					: res.status === 401
					? 'Invalid api key'
					: 'Could not connect';

			return; // TODO add notification
		}

		await user.updateUser((prev) => ({
			...prev,
			settings: {
				...prev.settings,
				sonarr: {
					...prev.settings.sonarr,
					baseUrl,
					apiKey
				}
			}
		}));

		tab.next();
	}

	async function handleConnectRadarr() {
		const baseUrl = radarrBaseUrl;
		const apiKey = radarrApiKey;
		if (!baseUrl || !apiKey) return;
		const res = await radarrApi.getHealth(baseUrl, apiKey);

		if (res.status !== 200) {
			res.status === 404
				? 'Server not found'
				: res.status === 401
				? 'Invalid api key'
				: 'Could not connect';

			return; // TODO add notification
		}

		await user.updateUser((prev) => ({
			...prev,
			settings: {
				...prev.settings,
				radarr: {
					...prev.settings.radarr,
					baseUrl,
					apiKey
				}
			}
		}));

		await finalizeSetup();
	}

	async function finalizeSetup() {
		await user.updateUser((prev) => ({
			...prev,
			onboardingDone: true
		}));
	}

	function handleBack() {
		tab.previous();
	}

	const tabContainer =
		'col-start-1 col-end-1 row-start-1 row-end-1 flex flex-col bg-primary-800 rounded-2xl p-10 shadow-xl max-w-lg';
</script>

<Container focusOnMount class="h-full w-full flex items-center justify-center" on:back={handleBack}>
	<Panel class="grid max-w-lg" size="dynamic">
		<Tab {...tab} tab={Tabs.Welcome} on:back={({ detail }) => detail.stopPropagation()}>
			<h1 class="header2 mb-2 w-full">Welcome to Reiverr</h1>
			<div class="body mb-8">
				Looks like this is a new account. This setup will get you started with connecting your
				services to get most out of Reiverr.
			</div>
			<Container direction="horizontal" class="flex space-x-4">
				<Button type="primary-dark" on:clickOrSelect={() => sessions.removeSession()}
					>Log Out</Button
				>
				<div class="flex-1">
					<Button type="primary-dark" on:clickOrSelect={() => tab.next()}>
						Next
						<div class="absolute inset-y-0 right-0 flex items-center justify-center">
							<ArrowRight size={24} />
						</div>
					</Button>
				</div>
			</Container>
		</Tab>

		<Tab {...tab} tab={Tabs.Tmdb}>
			<h1 class="header2 mb-2">Connect a TMDB Account</h1>
			<div class="body mb-8">
				Connect to TMDB for personalized recommendations based on your movie reviews and
				preferences.
			</div>

			<div class="space-y-4 flex flex-col">
				{#await connectedTmdbAccount then account}
					{#if account}
						<SelectField
							value={account.username || ''}
							on:clickOrSelect={() => {
								tab.set(Tabs.TmdbConnect);
								handleGenerateTMDBLink();
							}}>Logged in as</SelectField
						>
					{:else}
						<Button
							type="primary-dark"
							on:clickOrSelect={() => {
								tab.set(Tabs.TmdbConnect);
								handleGenerateTMDBLink();
							}}
						>
							Connect
							<ArrowRight size={19} slot="icon-absolute" />
						</Button>
					{/if}
				{/await}

				<Button type="primary-dark" on:clickOrSelect={() => tab.next()}>
					{#if $user?.settings.tmdb.userId}
						Next
					{:else}
						Skip
					{/if}
					<ArrowRight size={19} slot="icon-absolute" />
				</Button>
			</div>
		</Tab>

		<Tab
			{...tab}
			tab={Tabs.TmdbConnect}
			on:back={({ detail }) => {
				tab.set(Tabs.Tmdb);
				detail.stopPropagation();
			}}
		>
			<h1 class="header2 mb-2">Connect a TMDB Account</h1>
			<div class="body mb-8">
				To connect your TMDB account, log in via the link below and then click "Complete
				Connection".
			</div>

			{#if tmdbConnectQrCode}
				<div
					class="w-[150px] h-[150px] bg-contain bg-center mb-8 mx-auto"
					style={`background-image: url(${tmdbConnectQrCode})`}
				/>
			{/if}

			<Container direction="horizontal" class="flex space-x-4 *:flex-1">
				{#if !tmdbConnectRequestToken}
					<Button type="primary-dark" action={handleGenerateTMDBLink}>Generate Link</Button>
				{:else if tmdbConnectLink}
					<Button type="primary-dark" action={completeTMDBConnect}>Complete Connection</Button>
					<Button type="primary-dark" on:clickOrSelect={() => window.open(tmdbConnectLink)}>
						Open Link
						<ExternalLink size={19} slot="icon-after" />
					</Button>
				{/if}
			</Container>
		</Tab>

		<Tab {...tab} tab={Tabs.Jellyfin}>
			<h1 class="header2 mb-2">Connect to Jellyfin</h1>
			<div class="mb-8 body">Connect to Jellyfin to watch movies and tv shows.</div>

			<div class="space-y-4 mb-4">
				<TextField bind:value={jellyfinBaseUrl} isValid={jellyfinUsers.then((u) => !!u?.length)}>
					Base Url
				</TextField>
				<TextField bind:value={jellyfinApiKey} isValid={jellyfinUsers.then((u) => !!u?.length)}>
					API Key
				</TextField>
			</div>

			{#await jellyfinUsers then users}
				{#if users.length}
					<SelectField
						value={jellyfinUser?.Name || 'Select User'}
						on:clickOrSelect={() => tab.set(Tabs.SelectUser)}
					>
						User
					</SelectField>
				{/if}
			{/await}

			{#if jellyfinError}
				<div class="text-red-500 mb-4">{jellyfinError}</div>
			{/if}

			<Container direction="horizontal" class="grid grid-cols-2 gap-4 mt-4">
				<Button type="primary-dark" on:clickOrSelect={() => tab.previous()}>Back</Button>
				{#if jellyfinBaseUrl && jellyfinApiKey && jellyfinUser}
					<Button type="primary-dark" action={handleConnectJellyfin}>Connect</Button>
				{:else}
					<Button type="primary-dark" on:clickOrSelect={() => tab.next()}>Skip</Button>
				{/if}
			</Container>
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
				{#each users as user}
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

			<div class="space-y-4 mb-4">
				<TextField bind:value={sonarrBaseUrl}>Base Url</TextField>
				<TextField bind:value={sonarrApiKey}>API Key</TextField>
			</div>

			{#if sonarrError}
				<div class="text-red-500 mb-4">{sonarrError}</div>
			{/if}

			<Container direction="horizontal" class="grid grid-cols-2 gap-4 mt-4">
				<Button type="primary-dark" on:clickOrSelect={() => tab.previous()}>Back</Button>
				{#if sonarrBaseUrl && sonarrApiKey}
					<Button type="primary-dark" action={handleConnectSonarr}>Connect</Button>
				{:else}
					<Button type="primary-dark" on:clickOrSelect={() => tab.next()}>Skip</Button>
				{/if}
			</Container>
		</Tab>

		<Tab {...tab} tab={Tabs.Radarr}>
			<h1 class="header2 mb-2">Connect to Radarr</h1>
			<div class="mb-8">Connect to Radarr for requesting and managing movies.</div>

			<div class="space-y-4 mb-4">
				<TextField bind:value={radarrBaseUrl}>Base Url</TextField>
				<TextField bind:value={radarrApiKey}>API Key</TextField>
			</div>

			{#if radarrError}
				<div class="text-red-500 mb-4">{radarrError}</div>
			{/if}

			<Container direction="horizontal" class="grid grid-cols-2 gap-4 mt-4">
				<Button type="primary-dark" on:clickOrSelect={() => tab.previous()}>Back</Button>
				{#if radarrBaseUrl && radarrApiKey}
					<Button type="primary-dark" action={handleConnectRadarr}>Connect</Button>
				{:else}
					<Button type="primary-dark" on:clickOrSelect={() => tab.next()}>Skip</Button>
				{/if}
			</Container>
		</Tab>

		<Tab {...tab} tab={Tabs.Complete} class={classNames('w-full')}>
			<div class="flex items-center justify-center text-secondary-500 mb-4">
				<CheckCircled size={64} />
			</div>
			<h1 class="header2 text-center w-full">All Set!</h1>
			<div class="header1 mb-8 text-center">Reiverr is now ready to use.</div>

			<Container direction="horizontal" class="inline-flex space-x-4 w-full">
				<Button type="primary-dark" on:clickOrSelect={() => tab.previous()} icon={ArrowLeft}
					>Back</Button
				>
				<div class="flex-1">
					<Button type="primary-dark" on:clickOrSelect={finalizeSetup} iconAbsolute={ArrowRight}
						>Done</Button
					>
				</div>
			</Container>
		</Tab>
	</Panel>
</Container>
