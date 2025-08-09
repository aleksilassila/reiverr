<script lang="ts">
	import Container from './Container.svelte';
	import TextField from './TextField.svelte';
	import Button from './Button.svelte';
	import { createLocalStorageStore } from '../stores/localstorage.store';
	import { sessions } from '../stores/session.store';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ login: null }>();

	const baseUrl = createLocalStorageStore('baseUrl', window.location.origin || '');
	const name = createLocalStorageStore('username', '');
	let password: string = '';
	let error: string | undefined = undefined;

	let loading = false;

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
					dispatch('login');
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

	<TextField value={$baseUrl} on:change={(e) => baseUrl.set(e.detail)} class="mb-4 w-full">
		Server
	</TextField>

	<TextField value={$name} on:change={({ detail }) => name.set(detail)} class="mb-4 w-full">
		Name
	</TextField>
	<TextField bind:value={password} type="password" class="mb-8 w-full">Password</TextField>

	<Button type="primary-dark" disabled={loading} on:clickOrSelect={handleLogin} class="mb-4 w-full"
		>Submit</Button
	>

	{#if error}
		<div class="text-red-300 text-center">{error}</div>
	{/if}
</Container>
