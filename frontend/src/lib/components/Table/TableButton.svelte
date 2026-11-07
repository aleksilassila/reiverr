<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import Container from '../Container.svelte';
	import classNames from 'classnames';

	interface Props {
		onClickOrSelect?: ContainerProps['onClickOrSelect'];
		onEnter?: ContainerProps['onEnter'];
		disabled?: boolean;
		children?: Snippet;
	}

	let { disabled = false, children: content, onClickOrSelect, onEnter }: Props = $props();
</script>

<Container {onClickOrSelect} {disabled} class="float-left" {onEnter}>
	{#snippet children({ hasFocus })}
		<div
			class={classNames(
				'border-2 rounded-2xl p-1 cursor-pointer font-medium tracking-wide transition-colors',
				{
					'border-zinc-400': !hasFocus,
					'border-primary-500': hasFocus,
					'opacity-50': disabled
				}
			)}
		>
			<div
				class={classNames(
					'h-10 w-10 rounded-xl flex items-center justify-center transition-colors',
					{
						'bg-primary-500 text-secondary-800': hasFocus,
						'bg-transparent': !hasFocus
					}
				)}
			>
				{@render content?.()}
			</div>
		</div>
	{/snippet}
</Container>
