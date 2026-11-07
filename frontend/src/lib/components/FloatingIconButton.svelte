<script lang="ts">
	import type { ContainerProps } from '$lib/components/Container.type';
	import classNames from 'classnames';
	import type { Snippet } from 'svelte';
	import type { SvelteHTMLElements } from 'svelte/elements';
	import Container from './Container.svelte';

	type Props = Omit<SvelteHTMLElements['button'], 'type' | 'children'> & {
		disabled?: boolean;
		type?: 'floating' | 'solid';
		/** A Container that takes the focus instead of a plain button */
		container?: boolean;
		onClickOrSelect?: ContainerProps['onClickOrSelect'];
		children?: Snippet;
	};

	let {
		disabled = false,
		type = 'floating',
		container = false,
		children: content,
		onClickOrSelect,
		...rest
	}: Props = $props();
</script>

{#if !container}
	<button
		{...rest}
		class={classNames(
			'text-secondary-400 hover:text-secondary-200 p-1 flex items-center justify-center rounded-sm flex-shrink-0 bg-transparent',
			{
				'opacity-30 cursor-not-allowed pointer-events-none': disabled,
				'cursor-pointer': !disabled
			},
			rest.class
		)}
	>
		{@render content?.()}
	</button>
{:else}
	<Container {onClickOrSelect} class="cursor-pointer group">
		{#snippet children({ hasFocus })}
			<div
				class={classNames(
					'group-hover:bg-primary-500 group-hover:text-secondary-800 rounded-full p-3',
					{
						'bg-primary-500 text-secondary-800': hasFocus
					}
				)}
			>
				{@render content?.()}
			</div>
		{/snippet}
	</Container>
{/if}
