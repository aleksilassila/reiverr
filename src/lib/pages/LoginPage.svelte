<script lang="ts">
	import { getReiverrApiClient, reiverrApi } from '../apis/reiverr/reiverr-api';
	import Container from '../../Container.svelte';
	import { appState } from '../stores/app-state.store';
	import TextField from '../components/TextField.svelte';
	import Button from '../components/Button.svelte';

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
					error = 'Invalid credentials. Please try again.';
				} else if (res.error) {
					error = 'Error occurred: ' + res.error.message;
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
		<h1 class="header2 w-full mb-2">Login to Reiverr</h1>
		<div class="header1 mb-4">
			If this is your first time logging in, a new account will be created based on your
			credentials.
		</div>

		<TextField
			value={$appState.serverBaseUrl}
			on:change={(e) => appState.setBaseUrl(e.detail)}
			class="mb-4 w-full"
		>
			Server
		</TextField>

		<TextField bind:value={name} class="mb-4 w-full">Name</TextField>
		<TextField bind:value={password} type="password" class="mb-8 w-full">Password</TextField>

		<Button
			type="primary-dark"
			disabled={loading}
			on:clickOrSelect={handleLogin}
			class="mb-4 w-full">Submit</Button
		>

		{#if error}
			<div class="text-red-300 text-center">{error}</div>
		{/if}
	</Container>
</div>
