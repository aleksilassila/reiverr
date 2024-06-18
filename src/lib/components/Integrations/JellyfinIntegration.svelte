<script lang="ts">
	import TextField from '../TextField.svelte';
	import { appState } from '../../stores/app-state.store';
	import { createEventDispatcher } from 'svelte';
	import SelectField from '../SelectField.svelte';
	import { jellyfinApi, type JellyfinUser } from '../../apis/jellyfin/jellyfin-api';
	import { get } from 'svelte/store';
	import { _, dictionary } from 'svelte-i18n';


	const dispatch = createEventDispatcher<{
		change: { baseUrl: string; apiKey: string; stale: boolean };
		'click-user': { user: JellyfinUser | undefined; users: JellyfinUser[] };
	}>();

	export let baseUrl = '';
	export let apiKey = '';
	let originalBaseUrl: string | undefined;
	let originalApiKey: string | undefined;
	let timeout: ReturnType<typeof setTimeout>;
	let error = '';
	let jellyfinUsers: Promise<JellyfinUser[]> | undefined = undefined;
	export let jellyfinUser: JellyfinUser | undefined;

	appState.subscribe((appState) => {
		baseUrl = baseUrl || appState.user?.settings.jellyfin.baseUrl || '';
		apiKey = apiKey || appState.user?.settings.jellyfin.apiKey || '';

		originalBaseUrl = baseUrl;
		originalApiKey = apiKey;

		handleChange();
	});

	$: if (jellyfinUser)
		dispatch('change', {
			baseUrl,
			apiKey,
			stale:
				baseUrl && apiKey
					? jellyfinUser?.Id !== get(appState).user?.settings.jellyfin.userId
					: !jellyfinUser
		});

	function handleChange() {
		clearTimeout(timeout);
		error = '';
		jellyfinUsers = undefined;
		jellyfinUser = undefined;

		const baseUrlCopy = baseUrl;
		const apiKeyCopy = apiKey;

		dispatch('change', {
			baseUrl: '',
			apiKey: '',
			stale: baseUrl === '' && apiKey === '' && jellyfinUser === undefined
		});

		if (baseUrlCopy === '' || apiKeyCopy === '') return;

		timeout = setTimeout(async () => {
			jellyfinUsers = jellyfinApi.getJellyfinUsers(baseUrl, apiKey);

			const users = await jellyfinUsers;
			if (baseUrlCopy !== baseUrl || apiKeyCopy !== apiKey) return;

			if (users.length) {
				jellyfinUser = users.find((u) => u.Id === get(appState).user?.settings.jellyfin.userId);
				const stale =
					(baseUrlCopy !== originalBaseUrl || apiKeyCopy !== originalApiKey) &&
					jellyfinUser !== undefined;
				dispatch('change', { baseUrl: baseUrlCopy, apiKey: apiKeyCopy, stale });
			} else {
				error = 'Could not connect';
			}

			// if (res.status !== 200) {
			// 	error =
			// 		res.status === 404
			// 			? 'Server not found'
			// 			: res.status === 401
			// 			? 'Invalid api key'
			// 			: 'Could not connect';
			//
			// 	return; // TODO add notification
			// } else {
			// 	dispatch('change', { baseUrl: baseUrlCopy, apiKey: apiKeyCopy, stale });
			// }
		}, 1000);
	}
</script>

<div class="space-y-4 mb-4">
	<TextField
		bind:value={baseUrl}
		isValid={jellyfinUsers?.then((u) => !!u?.length)}
		on:change={handleChange}>{$_('settings.integrations.baseUrl')}</TextField
	>
	<TextField
		bind:value={apiKey}
		isValid={jellyfinUsers?.then((u) => !!u?.length)}
		on:change={handleChange}>{$_('settings.integrations.apiKey')}</TextField
	>
</div>

{#await jellyfinUsers then users}
	{#if users?.length}
		<SelectField
			value={jellyfinUser?.Name || 'Select User'}
			on:clickOrSelect={() => dispatch('click-user', { user: jellyfinUser, users })}
		>
		{$_('settings.integrations.user')}
		</SelectField>
	{/if}
{/await}

{#if error}
	<div class="text-red-500 mb-4">{error}</div>
{/if}
