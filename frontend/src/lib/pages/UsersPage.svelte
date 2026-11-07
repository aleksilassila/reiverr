<script lang="ts">
	import Container from '$components/Container.svelte';
	import classNames from 'classnames';
	import { Plus, Trash } from 'radix-icons-svelte';
	import { getReiverrApi } from '../apis/reiverr/reiverr-api';
	import Button from '../components/Button/Button.svelte';
	import AddUserDialog from '../components/Dialog/AddUserDialog.svelte';
	import Login from '../components/LoginForm.svelte';
	import { createModal } from '../components/Modal/modal.store';
	import ProfileIcon from '../components/ProfileIcon.svelte';
	import { navigate } from '../components/StackRouter/stack-router.store';
	import { profilePictures } from '../profile-pictures';
	import { type Session, sessions } from '../stores/session.store.js';

	async function getUsers(sessions: Session[]) {
		return Promise.all(
			sessions.map(async (session) =>
				getReiverrApi(session)
					.users.getUser(session.id)
					.then((r) => ({ session, user: r.data }))
					.catch((e) => ({ session, user: undefined, error: e }))
			)
		).then((us) => us.filter((u) => !!u.user));
	}

	function handleSwitchUser({ session, user }: Awaited<typeof users>[number]) {
		sessions.setActiveSession(session);
		navigate('/');
	}
	let users = $derived(getUsers($sessions.sessions));
</script>

<div class="px-32 py-16 h-full flex flex-col items-center justify-center">
	{#await users then users}
		{#if users?.length}
			<h1 class="h1 mb-16">Who is watching?</h1>
			<Container direction="grid" gridCols={4} class="flex space-x-8 mb-16">
				{#each users as item}
					{@const user = item.user}
					<Container onClickOrSelect={() => user && handleSwitchUser(item)}>
						{#snippet children({ hasFocusWithin })}
							<ProfileIcon
								class="mb-4"
								url={user?.profilePicture || profilePictures.keanu}
								onClickOrSelect={() => user && handleSwitchUser(item)}
							/>
							<div class={classNames('text-center h4', { '!text-secondary-100': hasFocusWithin })}>
								{user?.name}
							</div>
						{/snippet}
					</Container>
				{/each}
				<ProfileIcon
					url="profile-pictures/leo.webp"
					onClickOrSelect={() => createModal(AddUserDialog, {})}
					icon={Plus}
				/>
			</Container>
			<Container direction="horizontal" class="flex space-x-4">
				<Button
					onClickOrSelect={() => {
						sessions.removeSessions();
						navigate('/');
					}}
					icon={Trash}
				>
					Remove all Accounts
				</Button>
			</Container>
		{:else}
			<div class="bg-primary-800 rounded-2xl p-10 shadow-xl max-w-lg">
				<Login />
			</div>
		{/if}
	{/await}
</div>
