<script lang="ts">
	import { getReiverrApiClient, reiverrApi } from '../apis/reiverr/reiverr-api';
	import Container from '../../Container.svelte';
	import { appState } from '../stores/app-state.store';
	import TextField from '../components/TextField.svelte';
	import Button from '../components/Button.svelte';

	let name: string = 'test';
	let password: string = 'test';
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

<Container
	class="w-full h-full max-w-xs mx-auto flex flex-col items-center justify-center"
	focusOnMount
>
	<h1 class="font-semibold tracking-wide text-xl w-full mb-4">Login to Reiverr</h1>

	<TextField
		value={$appState.serverBaseUrl}
		on:change={(e) => appState.setBaseUrl(e.detail)}
		class="mb-4 w-full"
	>
		Server
	</TextField>

	<TextField bind:value={name} class="mb-4 w-full">Name</TextField>
	<TextField bind:value={password} type="password" class="mb-8 w-full">Name</TextField>

	<Button disabled={loading} on:clickOrSelect={handleLogin} class="mb-4 w-full">Submit</Button>

	{#if error}
		<div class="text-red-300 text-center">{error}</div>
	{/if}
</Container>
