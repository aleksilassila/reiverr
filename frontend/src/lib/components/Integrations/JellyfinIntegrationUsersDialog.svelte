<script lang="ts">
	import Dialog from '../Dialog/Dialog.svelte';
	import type { JellyfinUser } from '../../apis/jellyfin/jellyfin-api';
	import SelectItem from '../SelectItem.svelte';
	import { modalStack } from '../Modal/modal.store';

	export let users: JellyfinUser[];
	export let selectedUser: JellyfinUser | undefined;
	export let handleSelectUser: (user: JellyfinUser) => void;

	function handleSelect(user: JellyfinUser) {
		handleSelectUser(user);
		modalStack.closeTopmost();
	}
</script>

<Dialog>
	<h1 class="h4 mb-2">Users</h1>
	<div class="space-y-4">
		{#each users as user}
			<SelectItem
				selected={user.Id === selectedUser?.Id}
				on:clickOrSelect={() => handleSelect(user)}
			>
				{user.Name}
			</SelectItem>
		{/each}
	</div>
</Dialog>
