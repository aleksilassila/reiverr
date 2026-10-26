<script lang="ts">
	import { usePageQuery } from '$lib/queries/page-query';
	import { setTmdbAccount, tmdbQueries } from '$lib/queries/tmdb.queries';
	import { user } from '../../stores/user.store';
	import { createErrorNotification } from '../Notifications/notification.store';
	import SelectField from '../SelectField.svelte';
	import { Trash } from 'radix-icons-svelte';
	import { derived } from 'svelte/store';
	import classNames from 'classnames';

	const userId = derived(user, (user) => user?.settings.tmdb.userId);
	const account = usePageQuery(
		derived(userId, ($userId) => ({ ...tmdbQueries.accountDetails(), enabled: !!$userId }))
	);
	$: tmdbAccount = $userId ? $account.data : undefined;

	const handleDisconnectTmdb = () =>
		setTmdbAccount({ userId: '', sessionId: '' }).catch((e) =>
			createErrorNotification(
				'Could not disconnect the account',
				e?.response?.data?.message ?? e?.message
			)
		);
</script>

{#if !$account.isLoading}
	{#if tmdbAccount}
		<SelectField value={tmdbAccount.username || ''} action={handleDisconnectTmdb}>
			Connected to
			<Trash slot="icon" let:size let:iconClass {size} class={classNames(iconClass, '')} />
		</SelectField>
	{/if}
	<slot connected={!!tmdbAccount} />
{/if}
