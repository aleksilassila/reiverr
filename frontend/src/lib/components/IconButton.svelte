<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import Container from './Container.svelte';
	import classNames from 'classnames';
	interface Props {
		onClickOrSelect?: ContainerProps['onClickOrSelect'];
		children?: Snippet;
	}

	let { children: content, onClickOrSelect }: Props = $props();
</script>

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
