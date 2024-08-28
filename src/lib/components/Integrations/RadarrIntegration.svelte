<script lang="ts">
	import TextField from '../TextField.svelte';
	import { createEventDispatcher } from 'svelte';
	import { radarrApi } from '../../apis/radarr/radarr-api';
	import { user } from '../../stores/user.store';
	import { derived, get } from 'svelte/store';
	import { _ } from 'svelte-i18n';

	let baseUrl = get(user)?.settings.radarr.baseUrl || '';
	let apiKey = get(user)?.settings.radarr.apiKey || '';
	const originalBaseUrl = derived(user, (user) => user?.settings.radarr.baseUrl || '');
	const originalApiKey = derived(user, (user) => user?.settings.radarr.apiKey || '');

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
			const p = radarrApi.getHealth(baseUrlCopy, apiKeyCopy);
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
				radarr: {
					...prev.settings.radarr,
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
		{$_('settings.integrations.baseUrl')}
	</TextField>
	<TextField bind:value={apiKey} isValid={healthCheck} on:change={handleChange}>{$_('settings.integrations.apiKey')}</TextField>
</div>

{#if error}
	<div class="text-red-500 mb-4">{error}</div>
{/if}

<slot {handleSave} {stale} {empty} {unchanged} />
