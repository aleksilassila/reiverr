<script lang="ts">
	import Container from '$components/Container.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import classNames from 'classnames';
	import { Pencil2, Plus } from 'radix-icons-svelte';
	import EditProfileModal from '../../components/Dialog/CreateOrEditProfileModal.svelte';
	import { createModal } from '../../components/Modal/modal.store';
	import SelectField from '../../components/SelectField.svelte';
	import { reiverrApi, user } from '../../stores/user.store';

	let accounts = getAccounts();

	function getAccounts() {
		return reiverrApi.users.findAllUsers().then((r) => r.data);
	}

	const refresh = () => (accounts = getAccounts());
</script>

<Container>
	<h1 class="h3 mb-8">Server Accounts</h1>
	{#await accounts then accounts}
		<Container class="grid grid-cols-2 gap-4" direction="grid" gridCols={2}>
			{#each accounts.filter((a) => a.id !== $user?.id) as account (account.id)}
				<SelectField
					value={account.name || ''}
					on:enter={scrollIntoView({ vertical: 128 })}
					on:clickOrSelect={() => {
						createModal(EditProfileModal, {
							user: account,
							admin: true,
							onComplete: refresh
						});
					}}
				>
					{account.isAdmin ? 'Admin' : 'User'}
					<Pencil2 slot="icon" let:size let:iconClass {size} class={classNames(iconClass)} />
				</SelectField>
			{/each}
			<SelectField
				value="New Account"
				on:enter={scrollIntoView({ vertical: 128 })}
				on:clickOrSelect={() => {
					createModal(EditProfileModal, {
						createNew: true,
						onComplete: refresh
					});
				}}
			>
				Create
				<Plus slot="icon" let:size let:iconClass {size} class={classNames(iconClass)} />
			</SelectField>
		</Container>
	{/await}
</Container>
