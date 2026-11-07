<script lang="ts">
	import Container from './Container.svelte';
	import TextField from './TextField.svelte';
	import Button from './Button/Button.svelte';
	import { createLocalStorageStore } from '../stores/localstorage.store';
	import { sessions } from '../stores/session.store';

	import { PLATFORM_TV } from '$lib/constants';

	interface Props {
		onLogin?: () => void;
	}

	let { onLogin }: Props = $props();

	// The TV packages serve the app from a local origin, which is no server
	const baseUrl = createLocalStorageStore(
		'baseUrl',
		PLATFORM_TV ? '' : window.location.origin || ''
	);
	const name = createLocalStorageStore('username', '');
	let password: string = $state('');
	let error: string | undefined = $state(undefined);

	let loading = $state(false);

	function handleLogin() {
		loading = true;

		sessions
			.addSession($baseUrl, $name, password)
			.then((res) => {
				console.log('res', res);
				if (res?.request?.status === 401) {
					error = 'Invalid credentials. Please try again.';
				} else if (res?.request.status !== 200) {
					error = 'Error occurred: ' + res.request.statusText;
				} else {
					onLogin?.();
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

<Container class="flex flex-col" focusOnMount>
	<h1 class="h3 w-full mb-2">Login to Reiverr</h1>
	<div class="body mb-4">
		If this is your first time logging in, a new account will be created based on your credentials.
	</div>

	<TextField
		variant="primary-dark"
		value={$baseUrl}
		onChange={(e) => baseUrl.set(e)}
		class="mb-4 w-full"
	>
		Server
	</TextField>

	<TextField variant="primary-dark" value={$name} onChange={(e) => name.set(e)} class="mb-4 w-full">
		Name
	</TextField>
	<TextField variant="primary-dark" bind:value={password} type="password" class="mb-8 w-full">
		Password
	</TextField>

	<Button type="primary-dark" disabled={loading} onClickOrSelect={handleLogin} class="mb-4 w-full">
		Submit
	</Button>

	{#if error}
		<div class="text-red-300 text-center">{error}</div>
	{/if}
</Container>
