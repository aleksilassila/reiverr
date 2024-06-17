<script lang="ts">
	import { tmdbApi } from '../../apis/tmdb/tmdb-api';
	import { user } from '../../stores/user.store';
	import SelectField from '../SelectField.svelte';
	import { createEventDispatcher } from 'svelte';
	import Button from '../Button.svelte';
	import { ArrowRight, Trash } from 'radix-icons-svelte';
	import { derived } from 'svelte/store';
	import classNames from 'classnames';

	export let handleConnectTmdb: () => void;

	const dispatch = createEventDispatcher<{ 'click-user': null }>();
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
		<SelectField value={tmdbAccount.username || ''} action={handleDisconnectTmdb} class="mb-4">
			Connected to
			<Trash slot="icon" let:size let:iconClass {size} class={classNames(iconClass, '')} />
		</SelectField>
	{:else}
		<slot>
			<div class="flex space-x-4">
				<Button type="primary-dark" iconAfter={ArrowRight} on:clickOrSelect={handleConnectTmdb}>
					Connect
				</Button>
			</div>
		</slot>
	{/if}
{/await}
