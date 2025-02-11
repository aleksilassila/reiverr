<script lang="ts">
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import { type Session, sessions } from '../stores/session.store.js';
	import { reiverrApi } from '../apis/reiverr/reiverr-api';
	import Container from '$components/Container.svelte';
	import Button from '../components/Button.svelte';
	import classNames from 'classnames';
	import { navigate } from '../components/StackRouter/StackRouter';
	import { createModal } from '../components/Modal/modal.store';
	import AddUserDialog from '../components/Dialog/AddUserDialog.svelte';
	import Login from '../components/LoginForm.svelte';
	import { Plus, Trash } from 'radix-icons-svelte';
	import ProfileIcon from '../components/ProfileIcon.svelte';
	import { profilePictures } from '../profile-pictures';

	$: users = getUsers($sessions.sessions);

	async function getUsers(sessions: Session[]) {
		return Promise.all(
			sessions.map(async (session) =>
				reiverrApi
					.getClient(session.baseUrl, session.token)
					.GET('/users/{id}', { params: { path: { id: session.id } } })
					.then((r) => ({ session, user: r.data }))
					.catch((e) => ({ session, user: undefined, error: e }))
			)
		).then((us) => us.filter((u) => !!u.user));
	}

	function handleSwitchUser({ session, user }: Awaited<typeof users>[number]) {
		sessions.setActiveSession(session);
		navigate('/');
	}
</script>

{console.log('UsersPage')}
<DetachedPage sidebar={false} class="px-32 py-16 h-full flex flex-col items-center justify-center">
	{#await users then users}
		{#if users?.length}
			<h1 class="h1 mb-16">Who is watching?</h1>
			<Container direction="grid" gridCols={4} class="flex space-x-8 mb-16">
				{#each users as item}
					{@const user = item.user}
					<Container let:hasFocusWithin on:clickOrSelect={() => user && handleSwitchUser(item)}>
						<ProfileIcon
							class="mb-4"
							url={user?.profilePicture || profilePictures.keanu}
							on:clickOrSelect={() => user && handleSwitchUser(item)}
						/>
						<div class={classNames('text-center h4', { '!text-secondary-100': hasFocusWithin })}>
							{user?.name}
						</div>
					</Container>
				{/each}
				<ProfileIcon
					url="profile-pictures/leo.webp"
					on:clickOrSelect={() => createModal(AddUserDialog, {})}
					icon={Plus}
				/>
			</Container>
			<Container direction="horizontal" class="flex space-x-4">
				<Button
					on:clickOrSelect={() => {
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
</DetachedPage>
