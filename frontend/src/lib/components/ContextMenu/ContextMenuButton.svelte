<script lang="ts">
	import ContextMenu from './ContextMenu.svelte';

	export let heading = '';
</script>

<div class="relative">
	<ContextMenu position="absolute" {heading}>
		<slot name="menu" slot="menu" />
		<slot />
	</ContextMenu>
</div>
