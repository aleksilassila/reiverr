<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import classNames from 'classnames';
	import Container from './Container.svelte';

	interface Props {
		onClickOrSelect?: ContainerProps['onClickOrSelect'];
		onEnter?: ContainerProps['onEnter'];
		selected?: boolean;
		children?: Snippet;
		class?: string;
	}

	let { selected = false, children, onClickOrSelect, onEnter, class: className }: Props = $props();
</script>

<Container
	class={classNames(
		'rounded-full px-4 py-1 border-2 cursor-pointer select-none font-semibold text-lg shrink-0',
		selected
			? 'bg-secondary-100 text-secondary-950 border-secondary-100 focus:bg-primary-500 focus:border-primary-500'
			: 'bg-secondary-800 text-secondary-300 border-transparent focus:border-primary-500 hover:border-primary-500',
		className
	)}
	{onClickOrSelect}
	{onEnter}
	focusOnClick
>
	{@render children?.()}
</Container>
