<script lang="ts">
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';
	import { type Session, sessions } from '../stores/session.store.js';
	import { reiverrApi } from '../apis/reiverr/reiverr-api';
	import Container from '../../Container.svelte';
	import Button from '../components/Button.svelte';
	import { TMDB_PROFILE_LARGE } from '../constants';
	import classNames from 'classnames';
	import AnimateScale from '../components/AnimateScale.svelte';
	import { navigate } from '../components/StackRouter/StackRouter';
	import { createModal } from '../components/Modal/modal.store';
	import AddUserDialog from '../components/Dialog/AddUserDialog.svelte';
	import Login from '../components/Login.svelte';
	import { Plus, Trash } from 'radix-icons-svelte';
	import AddElementOverlay from '../components/AddElementOverlay.svelte';

	$: users = getUsers($sessions.sessions);

	async function getUsers(sessions: Session[]) {
		return Promise.all(
			sessions.map(async (session) =>
				reiverrApi
					.getClient(session.baseUrl, session.token)
					.GET('/user')
					.then((r) => ({ session, user: r.data }))
			)
		).then((us) => us.filter((u) => !!u.user));
	}

	function handleSwitchUser({ session, user }: Awaited<typeof users>[number]) {
		sessions.setActiveSession(session);
		navigate('/');
	}
</script>

<DetachedPage sidebar={false} class="px-32 py-16 h-full flex flex-col items-center justify-center">
	{#await users then users}
		{#if users?.length}
			<h1 class="header4 mb-16">Who is watching?</h1>
			<Container direction="grid" gridCols={4} class="flex space-x-8 mb-16">
				{#each users as item}
					{@const user = item.user}
					<Container let:hasFocus on:clickOrSelect={() => user && handleSwitchUser(item)}>
						<AnimateScale {hasFocus}>
							<div
								class={classNames('w-40 h-40 bg-center bg-cover mb-4 rounded-xl', {
									selected: hasFocus
								})}
								style={`background-image: url('${TMDB_PROFILE_LARGE}/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg')`}
							/>
							<div class={classNames('text-center header1', { '!text-secondary-100': hasFocus })}>
								{user?.name}
							</div>
						</AnimateScale>
					</Container>
				{/each}
				<Container let:hasFocus on:clickOrSelect={() => createModal(AddUserDialog, {})}>
					<AnimateScale {hasFocus}>
						<div
							class={classNames('relative overflow-hidden rounded-xl mb-4 w-40 h-40', {
								selected: hasFocus
							})}
						>
							<div
								class={`w-full h-full bg-center bg-cover`}
								style={`background-image: url('${TMDB_PROFILE_LARGE}/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg')`}
							/>
							<AddElementOverlay />
						</div>
						<!--						<div class={classNames('text-center header1', { '!text-secondary-100': hasFocus })}>-->
						<!--							Add User-->
						<!--						</div>-->
					</AnimateScale>
				</Container>
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
