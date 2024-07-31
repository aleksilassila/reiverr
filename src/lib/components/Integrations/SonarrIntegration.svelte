<script lang="ts">
	import TextField from '../TextField.svelte';
	import { sonarrApi } from '../../apis/sonarr/sonarr-api';
	import { createEventDispatcher } from 'svelte';
	import { user } from '../../stores/user.store';
	import { derived, get } from 'svelte/store';

	let baseUrl = get(user)?.settings.sonarr.baseUrl || '';
	let apiKey = get(user)?.settings.sonarr.apiKey || '';
	const originalBaseUrl = derived(user, (u) => u?.settings.sonarr.baseUrl || '');
	const originalApiKey = derived(user, (u) => u?.settings.sonarr.apiKey || '');

	let stale = false;
	let error = '';
	let timeout: ReturnType<typeof setTimeout>;
	let healthCheck: Promise<boolean> | undefined;

	$: {
		$originalBaseUrl;
		$originalApiKey;
		stale = getIsStale();
	}

	handleChange();

	function getIsStale() {
		return (
			(!!healthCheck || (!baseUrl && !apiKey)) &&
			($originalBaseUrl !== baseUrl || $originalApiKey !== apiKey)
		);
	}

	function handleChange() {
		clearTimeout(timeout);
		stale = false;
		error = '';
		healthCheck = undefined;

		if (baseUrl === '' || apiKey === '') {
			stale = getIsStale();
			return;
		}

		const baseUrlCopy = baseUrl;
		const apiKeyCopy = apiKey;
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

				stale = false; // TODO add notification
			} else {
				stale = getIsStale();
			}
		}, 1000);
	}

	async function handleSave() {
		return user.updateUser((prev) => ({
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
	}

	$: empty = !baseUrl && !apiKey;
	$: unchanged = baseUrl === $originalBaseUrl && apiKey === $originalApiKey;
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

<slot {handleSave} {stale} {empty} {unchanged} />
