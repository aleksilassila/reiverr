<script lang="ts">
	import { getReiverrApiClient, reiverrApi } from '../apis/reiverr/reiverr-api';
	import Container from '../../Container.svelte';
	import { appState } from '../stores/app-state.store';
	import TextField from '../components/TextField.svelte';
	import Button from '../components/Button.svelte';
	import { _ } from 'svelte-i18n';

	let name: string = '';
	let password: string = '';
	let error: string | undefined = undefined;

	let loading = false;

	function handleLogin() {
		loading = true;

		reiverrApi
			.authenticate(name, password)
			.then((res) => {
				if (res.error?.statusCode === 401) {
					error = $_('login.invalidCredentials');
				} else if (res.error) {
					error = $_('login.errorOccurred') + ': ' + res.error.message;
				} else {
					const token = res.data.accessToken;
					appState.setToken(token);
					// window.location.reload();
				}
			})
			.catch((err: Error) => {
				error = err.name + ': ' + err.message;
			})
			.finally(() => {
				loading = false;
			});
	}
</script>

<div class="w-full h-full flex items-center justify-center">
	<Container class="flex flex-col bg-primary-800 rounded-2xl p-10 shadow-xl max-w-lg" focusOnMount>
		<h1 class="header2 w-full mb-2">{$_('login.title')}</h1>
		<div class="header1 mb-4">
			{$_('login.firstTime')}
		</div>

		<TextField
			value={$appState.serverBaseUrl}
			on:change={(e) => appState.setBaseUrl(e.detail)}
			class="mb-4 w-full"
		>
			{$_('login.server')}
		</TextField>

		<TextField bind:value={name} class="mb-4 w-full">{$_('login.name')}</TextField>
		<TextField bind:value={password} type="password" class="mb-8 w-full">{$_('login.password')}</TextField>

		<Button
			type="primary-dark"
			disabled={loading}
			on:clickOrSelect={handleLogin}
			class="mb-4 w-full"
		>
			{$_('login.submit')}
		</Button>

		{#if error}
			<div class="text-red-300 text-center">{error}</div>
		{/if}
	</Container>
</div>
