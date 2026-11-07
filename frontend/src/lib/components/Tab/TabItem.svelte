<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import Container from '$lib/components/Container.svelte';
	import classNames from 'classnames';

	interface Props {
		onEnter?: ContainerProps['onEnter'];
		onSelect?: () => void;
		selected?: boolean;
		disabled?: boolean;
		size?: 'sm' | 'md';
		children?: Snippet;
		class?: string;
	}

	let {
		selected = false,
		disabled = false,
		size = 'md',
		children: content,
		onSelect,
		onEnter,
		class: className
	}: Props = $props();
</script>

<Container
	class={classNames(
		'group',
		disabled ? 'cursor-not-allowed pointer-events-none opacity-40' : 'cursor-pointer'
	)}
	{disabled}
	onClickOrSelect={() => onSelect?.()}
	{onEnter}
	focusOnClick
>
	{#snippet children({ hasFocus })}
		<span
			class={classNames(
				'font-semibold group-focus-within:text-primary-500',
				size === 'sm' ? 'text-lg' : 'text-2xl',
				{
					'text-secondary-50': selected && !hasFocus,
					'text-secondary-400': !hasFocus && !selected
				},
				className
			)}
		>
			{@render content?.()}
		</span>
	{/snippet}
</Container>
