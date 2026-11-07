<script lang="ts">
	import type { Snippet } from 'svelte';
	import classNames from 'classnames';

	interface Props {
		visible?: boolean;
		children?: Snippet<[{ visible: boolean }]>;
		class?: string;
	}

	let { visible = false, children, class: className }: Props = $props();
</script>

<div
	class={classNames(
		'py-6 fixed top-0 inset-x-0 z-10 bg-gradient-to-b from-100% from-secondary-900 to-transparent transition-all',
		{
			'opacity-0 pointer-events-none -translate-y-4': visible
		},
		className
	)}
>
	{@render children?.({ visible })}
</div>
