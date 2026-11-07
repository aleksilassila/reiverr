<script lang="ts">
	import type { Snippet } from 'svelte';
	import ContextMenu from './ContextMenu.svelte';

	interface Props {
		heading?: string;
		menu?: Snippet;
		children?: Snippet;
	}

	let { heading = '', menu, children }: Props = $props();

	const menu_render = $derived(menu);
</script>

<div class="relative">
	<ContextMenu position="absolute" {heading}>
		{#snippet menu()}
			{@render menu_render?.()}
		{/snippet}
		{@render children?.()}
	</ContextMenu>
</div>
