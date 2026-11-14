<script lang="ts">
	import type { Snippet } from 'svelte';
	import { usePageQuery } from '$lib/queries/page-query';
	import { setTmdbAccount, tmdbQueries } from '$lib/queries/tmdb.queries';
	import { user } from '../../stores/user.store';
	import { createErrorNotification } from '../Notifications/notification.store';
	import SelectField from '../SelectField.svelte';
	import { Trash } from 'radix-icons-svelte';
	import classNames from 'classnames';
	interface Props {
		children?: Snippet<[{ connected: boolean }]>;
	}

	let { children }: Props = $props();

	let userId = $derived($user?.settings.tmdb.userId);
	const account = usePageQuery(() => ({ ...tmdbQueries.accountDetails(), enabled: !!userId }));
	let tmdbAccount = $derived(userId ? account.data : undefined);

	const handleDisconnectTmdb = () =>
		setTmdbAccount({ userId: '', sessionId: '' }).catch((e) =>
			createErrorNotification(
				'Could not disconnect the account',
				e?.response?.data?.message ?? e?.message
			)
		);
</script>

{#if !account.isLoading}
	{#if tmdbAccount}
		<SelectField value={tmdbAccount.username || ''} action={handleDisconnectTmdb}>
			Connected to
			{#snippet icon({ size, iconClass })}
				<Trash {size} class={classNames(iconClass, '')} />
			{/snippet}
		</SelectField>
	{/if}
	{@render children?.({ connected: !!tmdbAccount })}
{/if}
