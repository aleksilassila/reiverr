<script lang="ts">
	import TextField from '../TextField.svelte';
	import { user } from '../../stores/user.store';
	import { createEventDispatcher } from 'svelte';
	import SelectField from '../SelectField.svelte';
	import { jellyfinApi, type JellyfinUser } from '../../apis/jellyfin/jellyfin-api';
	import { derived, get } from 'svelte/store';

	const dispatch = createEventDispatcher<{
		change: { baseUrl: string; apiKey: string; stale: boolean };
		'click-user': { user: JellyfinUser | undefined; users: JellyfinUser[] };
	}>();

	export let baseUrl = get(user)?.settings.jellyfin.baseUrl || '';
	export let apiKey = get(user)?.settings.jellyfin.apiKey || '';
	let originalBaseUrl = derived(user, (user) => user?.settings.jellyfin.baseUrl || '');
	let originalApiKey = derived(user, (user) => user?.settings.jellyfin.apiKey || '');
	let timeout: ReturnType<typeof setTimeout>;
	let error = '';
	let jellyfinUsers: Promise<JellyfinUser[]> | undefined = undefined;
	export let jellyfinUser: JellyfinUser | undefined;

	$: {
		if ($originalBaseUrl !== baseUrl && $originalApiKey !== apiKey) handleChange();
		else dispatch('change', { baseUrl, apiKey, stale: false });
	}

	$: if (jellyfinUser)
		dispatch('change', {
			baseUrl,
			apiKey,
			stale:
				baseUrl && apiKey ? jellyfinUser?.Id !== get(user)?.settings.jellyfin.userId : !jellyfinUser
		});

	handleChange();

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
			stale:
				baseUrl === '' &&
				apiKey === '' &&
				jellyfinUser === undefined &&
				(baseUrl !== $originalBaseUrl || apiKey !== $originalApiKey)
		});

		if (baseUrlCopy === '' || apiKeyCopy === '') return;

		timeout = setTimeout(async () => {
			jellyfinUsers = jellyfinApi.getJellyfinUsers(baseUrl, apiKey);

			const users = await jellyfinUsers;
			if (baseUrlCopy !== baseUrl || apiKeyCopy !== apiKey) return;

			if (users.length) {
				jellyfinUser = users.find((u) => u.Id === get(user)?.settings.jellyfin.userId);
				const stale =
					(baseUrlCopy !== $originalBaseUrl || apiKeyCopy !== $originalApiKey) &&
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
		on:change={handleChange}
	>
		Base Url
	</TextField>
	<TextField
		bind:value={apiKey}
		isValid={jellyfinUsers?.then((u) => !!u?.length)}
		on:change={handleChange}
	>
		API Key
	</TextField>
</div>

{#await jellyfinUsers then users}
	{#if users?.length}
		<SelectField
			value={jellyfinUser?.Name || 'Select User'}
			on:clickOrSelect={() => dispatch('click-user', { user: jellyfinUser, users })}
		>
			User
		</SelectField>
	{/if}
{/await}

{#if error}
	<div class="text-red-500 mb-4">{error}</div>
{/if}
