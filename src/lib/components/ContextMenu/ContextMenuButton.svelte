<script lang="ts">
	import ContextMenu from './ContextMenu.svelte';
	import { contextMenu } from '../ContextMenu/ContextMenu';
	import Button from '../Button.svelte';
	import { DotsVertical } from 'radix-icons-svelte';

	export let heading = '';

	export let contextMenuId = Symbol();

	function handleToggleVisibility() {
		if ($contextMenu === contextMenuId) contextMenu.hide();
		else contextMenu.show(contextMenuId);
	}
</script>

<div class="relative">
	<ContextMenu position="absolute" {heading} id={contextMenuId}>
		<slot name="menu" slot="menu" />

		<Button slim on:click={handleToggleVisibility}>
			<DotsVertical size={24} />
		</Button>
	</ContextMenu>
</div>
