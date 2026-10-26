<script lang="ts">
	import Container from '../Container.svelte';
	import {
		requestTmdbAccessToken,
		requestTmdbToken,
		setTmdbAccount
	} from '../../queries/tmdb.queries';
	import Button from '../Button/Button.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import { ExternalLink } from 'radix-icons-svelte';

	const dispatch = createEventDispatcher<{ connected: null }>();

	let tmdbConnectRequestToken: string | undefined = undefined;
	let tmdbConnectLink: string | undefined = undefined;
	let tmdbConnectQrCode: string | undefined = undefined;
	let tmdbError: string = '';

	handleGenerateTMDBLink();

	async function handleGenerateTMDBLink() {
		return requestTmdbToken().then((res) => {
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
		return requestTmdbAccessToken(tmdbConnectRequestToken).then(async (res) => {
			const { status_code, access_token, account_id } = res || {};
			if (status_code !== 1 || !access_token || !account_id) {
				tmdbError = 'Failed to connect account. Did you approve the request?';
				return; // TODO add notification
			}

			await setTmdbAccount({ userId: account_id, sessionId: access_token });

			dispatch('connected');
		});
	}
</script>

<h1 class="h3 mb-2">Connect a TMDB Account</h1>
<div class="body mb-8">
	To connect your TMDB account, log in via the link below and then click "Complete Connection".
</div>

{#if tmdbConnectQrCode}
	<div
		class="w-[150px] h-[150px] bg-contain bg-center mb-8 mx-auto"
		style={`background-image: url(${tmdbConnectQrCode})`}
	/>
{/if}

{#if tmdbError}
	<div class="text-red-500 mb-4">{tmdbError}</div>
{/if}

<Container direction="horizontal" class="flex space-x-4 *:flex-1">
	<!--{#if !tmdbConnectRequestToken}-->
	<!--	<Button type="primary-dark" action={handleGenerateTMDBLink}>Generate Link</Button>-->
	{#if tmdbConnectLink}
		<Button type="primary-dark" action={completeTMDBConnect}>Complete Connection</Button>
		<Button type="primary-dark" on:clickOrSelect={() => window.open(tmdbConnectLink)}>
			Open Link
			<ExternalLink size={19} slot="icon-after" />
		</Button>
	{/if}
</Container>
