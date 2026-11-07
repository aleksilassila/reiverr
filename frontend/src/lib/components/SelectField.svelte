<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import Container from './Container.svelte';
	import { ArrowRight } from 'radix-icons-svelte';
	import classNames from 'classnames';

	interface Props {
		onEnter?: ContainerProps['onEnter'];
		onClickOrSelect?: () => void;
		type?: 'primary' | 'primary-dark' | 'transparent';
		value?: string;
		disabled?: boolean;
		action?: (() => Promise<any>) | undefined;
		content?: Snippet;
		children?: Snippet;
		icon?: Snippet<[{ size: number; iconClass: string }]>;
		class?: string;
	}

	let {
		type = 'primary',
		value = '',
		disabled = false,
		action = undefined,
		content,
		children: label,
		icon,
		onClickOrSelect,
		onEnter,
		class: className
	}: Props = $props();

	let actionIsFetching = $state(false);
	let _disabled = $derived(disabled || actionIsFetching);

	function handleClickOrSelect() {
		if (actionIsFetching || _disabled) return;

		if (action) {
			actionIsFetching = true;
			action().then(() => (actionIsFetching = false));
		}

		onClickOrSelect?.();
	}
</script>

<Container
	class={classNames(
		'flex items-center justify-between rounded-xl px-6 py-2.5 font-medium',
		'border-2 border-transparent focus:border-primary-500 hover:border-primary-500 group',
		{
			'cursor-pointer': !_disabled,
			'cursor-not-allowed pointer-events-none opacity-40': _disabled,
			'bg-secondary-800': type === 'primary',
			'bg-primary-900': type === 'primary-dark',
			'bg-secondary-700/50': type === 'transparent'
		},
		className
	)}
	onClickOrSelect={handleClickOrSelect}
	{onEnter}
>
	{#snippet children({ hasFocus })}
		<div>
			{#if !content}
				<h1 class="text-secondary-300 font-semibold tracking-wide text-sm">
					{@render label?.()}
				</h1>
				<span>
					{value}
				</span>
			{:else}
				{@render content?.()}
			{/if}
		</div>
		{#if icon}{@render icon({
				size: 24,
				iconClass: classNames('group-hover:text-primary-500 group-hover:scale-110', {
					'text-primary-500 scale-110': hasFocus
				})
			})}{:else}
			<ArrowRight
				class={classNames('transition-transform', {
					'text-primary-500 translate-x-0.5 scale-110': hasFocus,
					'group-hover:text-primary-500 group-hover:translate-x-0.5 group-hover:scale-110': true
				})}
				size={24}
			/>
		{/if}
	{/snippet}
</Container>
