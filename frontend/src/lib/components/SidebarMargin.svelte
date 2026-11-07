<script lang="ts">
	import type { Snippet } from 'svelte';
	import classNames from 'classnames';
	interface Props {
		children?: Snippet;
		class?: string;
	}

	let { children, class: className }: Props = $props();
</script>

<div class={classNames('pl-16', className)}>
	{@render children?.()}
</div>
