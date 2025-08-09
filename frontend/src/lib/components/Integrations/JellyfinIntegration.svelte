<script lang="ts">
	import TextField from '../TextField.svelte';
	import { user } from '../../stores/user.store';
	import { createEventDispatcher } from 'svelte';
	import SelectField from '../SelectField.svelte';
	import { jellyfinApi, type JellyfinUser } from '../../apis/jellyfin/jellyfin-api';
	import { derived, get } from 'svelte/store';

	const dispatch = createEventDispatcher<{
		'click-user': {
			user: JellyfinUser | undefined;
			users: JellyfinUser[];
			setJellyfinUser: typeof setJellyfinUser;
		};
	}>();

	let baseUrl = get(user)?.settings.jellyfin.baseUrl || '';
	let apiKey = get(user)?.settings.jellyfin.apiKey || '';
	export let jellyfinUser: JellyfinUser | undefined = undefined;
	const originalBaseUrl = derived(user, (user) => user?.settings.jellyfin.baseUrl || '');
	const originalApiKey = derived(user, (user) => user?.settings.jellyfin.apiKey || '');
	const originalUserId = derived(user, (user) => user?.settings.jellyfin.userId || undefined);

	let timeout: ReturnType<typeof setTimeout>;
	export let jellyfinUsers: Promise<JellyfinUser[]> | undefined = undefined;

	let stale = false;
	let error = '';

	$: {
		jellyfinUser;
		$originalBaseUrl;
		$originalApiKey;
		$originalUserId;
		stale = getIsStale();
	}

	handleChange();

	function getIsStale() {
		return (
			(!!jellyfinUser?.Id || (!baseUrl && !apiKey && !jellyfinUser)) &&
			($originalBaseUrl !== baseUrl ||
				$originalApiKey !== apiKey ||
				$originalUserId !== jellyfinUser?.Id)
		);
	}

	function handleChange() {
		clearTimeout(timeout);
		stale = false;
		error = '';
		jellyfinUsers = undefined;
		jellyfinUser = undefined;

		if (baseUrl === '' || apiKey === '') {
			stale = getIsStale();
			return;
		}

		const baseUrlCopy = baseUrl;
		const apiKeyCopy = apiKey;
		timeout = setTimeout(async () => {
			jellyfinUsers = jellyfinApi.getJellyfinUsers(baseUrl, apiKey);

			const users = await jellyfinUsers;
			if (baseUrlCopy !== baseUrl || apiKeyCopy !== apiKey) return;

			if (users.length) {
				jellyfinUser = users.find((u) => u.Id === get(user)?.settings.jellyfin.userId);
				// stale = !!jellyfinUser?.Id && getIsStale();
			} else {
				error = 'Could not connect';
				stale = false;
			}
		}, 1000);
	}

	const setJellyfinUser = (u: JellyfinUser) => (jellyfinUser = u);

	async function handleSave() {
		if (!stale) return;

		return user.updateUser((prev) => ({
			...prev,
			settings: {
				...prev.settings,
				jellyfin: {
					...prev.settings.jellyfin,
					baseUrl,
					apiKey,
					userId: jellyfinUser?.Id || ''
				}
			}
		}));
	}

	$: empty = !baseUrl && !apiKey && !jellyfinUser;
	$: unchanged =
		$originalBaseUrl === baseUrl &&
		$originalApiKey === apiKey &&
		$originalUserId === jellyfinUser?.Id;
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
			on:clickOrSelect={() =>
				dispatch('click-user', { user: jellyfinUser, users, setJellyfinUser })}
			class="mb-4"
		>
			User
		</SelectField>
	{/if}
{/await}

{#if error}
	<div class="text-red-500 mb-4">{error}</div>
{/if}

<slot {handleSave} {stale} {empty} {unchanged} />
