<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import classNames from 'classnames';
	import Container from './Container.svelte';

	interface Props {
		onMounted?: ContainerProps['onMounted'];
		onEnter?: ContainerProps['onEnter'];
		onSelect?: ContainerProps['onSelect'];
		onclick?: ContainerProps['onclick'];
		onClickOrSelect?: ContainerProps['onClickOrSelect'];
		onNavigate?: ContainerProps['onNavigate'];
		type?: 'transparent';
		focusOnMount?: boolean;
		focusedChild?: boolean;
		children?: Snippet<[{ hasFocus: boolean }]>;
		class?: string;
	}

	let {
		type = 'transparent',
		focusOnMount = false,
		focusedChild = false,
		children: content,
		onMounted,
		onEnter,
		onSelect,
		onclick,
		onClickOrSelect,
		onNavigate,
		class: className
	}: Props = $props();
</script>

<Container
	class={className}
	{onMounted}
	{onEnter}
	{onSelect}
	{onclick}
	{onClickOrSelect}
	{onNavigate}
	{focusOnMount}
	{focusedChild}
	focusOnClick
>
	{#snippet children({ hasFocus })}
		<div
			class={classNames(
				'cursor-pointer select-none flex items-center rounded-xl px-6 py-2.5 border-2 group',
				{
					'border-transparent text-secondary-200 hover:border-secondary-700/50 hover:bg-secondary-700/50 hover:text-secondary-100':
						type === 'transparent' && !hasFocus,
					'border-secondary-700/50 bg-secondary-700/50 text-secondary-100':
						type === 'transparent' && hasFocus
				}
			)}
		>
			{@render content?.({ hasFocus })}
		</div>
	{/snippet}
</Container>
