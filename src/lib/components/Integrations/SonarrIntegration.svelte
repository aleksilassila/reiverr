<script lang="ts">
	import TextField from '../TextField.svelte';
	import { sonarrApi } from '../../apis/sonarr/sonarr-api';
	import { createEventDispatcher } from 'svelte';
	import { user } from '../../stores/user.store';
	import { derived, get } from 'svelte/store';

	const dispatch = createEventDispatcher<{
		change: { baseUrl: string; apiKey: string; stale: boolean };
	}>();

	export let baseUrl = get(user)?.settings.sonarr.baseUrl || '';
	export let apiKey = get(user)?.settings.sonarr.apiKey || '';
	const originalBaseUrl = derived(user, (u) => u?.settings.sonarr.baseUrl || '');
	const originalApiKey = derived(user, (u) => u?.settings.sonarr.apiKey || '');
	let timeout: ReturnType<typeof setTimeout>;
	let error = '';
	let healthCheck: Promise<boolean> | undefined;

	$: {
		if ($originalBaseUrl !== baseUrl && $originalApiKey !== apiKey) handleChange();
		else dispatch('change', { baseUrl, apiKey, stale: false });
	}

	handleChange();

	function handleChange() {
		console.log('handleChange', $originalBaseUrl, baseUrl, $originalApiKey, apiKey);

		clearTimeout(timeout);
		error = '';
		healthCheck = undefined;

		const baseUrlCopy = baseUrl;
		const apiKeyCopy = apiKey;
		const stale = baseUrlCopy !== $originalBaseUrl || apiKeyCopy !== $originalApiKey;

		dispatch('change', {
			baseUrl: '',
			apiKey: '',
			stale: baseUrl === '' && apiKey === '' && stale
		});

		if (baseUrlCopy === '' || apiKeyCopy === '') return;

		timeout = setTimeout(async () => {
			const p = sonarrApi.getHealth(baseUrlCopy, apiKeyCopy);
			healthCheck = p.then((res) => res.status === 200);

			const res = await p;
			if (baseUrlCopy !== baseUrl || apiKeyCopy !== apiKey) return;
			if (res.status !== 200) {
				error =
					res.status === 404
						? 'Server not found'
						: res.status === 401
						? 'Invalid api key'
						: 'Could not connect';

				return; // TODO add notification
			} else {
				dispatch('change', { baseUrl: baseUrlCopy, apiKey: apiKeyCopy, stale });
			}
		}, 1000);
	}
</script>

<div class="space-y-4 mb-4">
	<TextField bind:value={baseUrl} isValid={healthCheck} on:change={handleChange}>
		Base Url
	</TextField>
	<TextField bind:value={apiKey} isValid={healthCheck} on:change={handleChange}>API Key</TextField>
</div>

{#if error}
	<div class="text-red-500 mb-4">{error}</div>
{/if}
