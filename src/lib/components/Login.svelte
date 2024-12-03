<script lang="ts">
	import Container from '../../Container.svelte';
	import TextField from '../components/TextField.svelte';
	import Button from '../components/Button.svelte';
	import { createLocalStorageStore } from '../stores/localstorage.store';
	import { sessions } from '../stores/session.store';
	import { createEventDispatcher } from 'svelte';
	import { _ } from 'svelte-i18n';

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
					error = $_('login.invalidCredentials');
				} else if (res?.request.status !== 200) {
					error = $_('login.errorOccurred') + ': ' + res.request.statusText;
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
	<h1 class="header2 w-full mb-2">{$_('login.title')}</h1>
	<div class="body mb-4">
		{$_('login.firstTime')}
	</div>

	<TextField value={$baseUrl} on:change={(e) => baseUrl.set(e.detail)} class="mb-4 w-full">
		{$_('login.server')}
	</TextField>

	<TextField value={$name} on:change={({ detail }) => name.set(detail)} class="mb-4 w-full">
		{$_('login.name')}
	</TextField>
	<TextField bind:value={password} type="password" class="mb-8 w-full">{$_('login.password')}</TextField>

	<Button type="primary-dark" disabled={loading} on:clickOrSelect={handleLogin} class="mb-4 w-full"
		>{$_('login.submit')}</Button
	>

	{#if error}
		<div class="text-red-300 text-center">{error}</div>
	{/if}
</Container>
