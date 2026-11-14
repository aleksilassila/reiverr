<script lang="ts">
	import Container from '$components/Container.svelte';
	import { usePageQuery } from '$lib/queries/page-query';
	import { usersQueries } from '$lib/queries/users.queries';
	import { scrollIntoView } from '$lib/selectable';
	import classNames from 'classnames';
	import { Pencil2, Plus } from 'radix-icons-svelte';
	import EditProfileModal from '../../components/Dialog/CreateOrEditProfileModal.svelte';
	import { createModal } from '../../components/Modal/modal.store';
	import SelectField from '../../components/SelectField.svelte';
	import { user } from '../../stores/user.store';

	const accounts = usePageQuery(() => usersQueries.list());
</script>

<Container>
	<h1 class="h3 mb-8">Server Accounts</h1>
	{#if accounts.data}
		{@const accountList = accounts.data}
		<Container class="grid grid-cols-2 gap-4" direction="grid" gridCols={2}>
			{#each accountList.filter((a) => a.id !== $user?.id) as account (account.id)}
				<SelectField
					value={account.name || ''}
					onEnter={scrollIntoView({ vertical: 128 })}
					onClickOrSelect={() => {
						createModal(EditProfileModal, {
							user: account,
							admin: true
						});
					}}
				>
					{account.isAdmin ? 'Admin' : 'User'}
					{#snippet icon({ size, iconClass })}
						<Pencil2 {size} class={classNames(iconClass)} />
					{/snippet}
				</SelectField>
			{/each}
			<SelectField
				value="New Account"
				onEnter={scrollIntoView({ vertical: 128 })}
				onClickOrSelect={() => {
					createModal(EditProfileModal, {
						createNew: true
					});
				}}
			>
				Create
				{#snippet icon({ size, iconClass })}
					<Plus {size} class={classNames(iconClass)} />
				{/snippet}
			</SelectField>
		</Container>
	{/if}
</Container>
