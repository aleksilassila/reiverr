<script lang="ts">
	import { tmdbApi } from '../../apis/tmdb/tmdb-api';
	import { user } from '../../stores/user.store';
	import SelectField from '../SelectField.svelte';
	import { Trash } from 'radix-icons-svelte';
	import { derived } from 'svelte/store';
	import classNames from 'classnames';

	const userId = derived(user, (user) => user?.settings.tmdb.userId);

	$: connectedTmdbAccount = !!$userId && tmdbApi.getAccountDetails();

	async function handleDisconnectTmdb() {
		return user.updateUser((prev) => ({
			...prev,
			settings: {
				...prev.settings,
				tmdb: {
					...prev.settings.tmdb,
					userId: '',
					sessionId: ''
				}
			}
		}));
	}
</script>

{#await connectedTmdbAccount then tmdbAccount}
	{#if tmdbAccount}
		<SelectField value={tmdbAccount.username || ''} action={handleDisconnectTmdb}>
			Connected to
			<Trash slot="icon" let:size let:iconClass {size} class={classNames(iconClass, '')} />
		</SelectField>
	{/if}
	<slot connected={!!tmdbAccount} />
{/await}
