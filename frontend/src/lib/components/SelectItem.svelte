<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import Container from './Container.svelte';
	import { ArrowRight, Check } from 'radix-icons-svelte';
	import classNames from 'classnames';

	interface Props {
		onClickOrSelect?: ContainerProps['onClickOrSelect'];
		onEnter?: ContainerProps['onEnter'];
		selected: boolean;
		children?: Snippet;
	}

	let { selected, children, onClickOrSelect, onEnter }: Props = $props();
</script>

<Container
	class="flex items-center justify-between bg-primary-900 rounded-xl px-6 py-2.5 font-medium
		   border-2 border-transparent focus:border-primary-500 hover:border-primary-500 cursor-pointer group"
	{onClickOrSelect}
	{onEnter}
	focusOnClick
	focusOnMount={selected}
>
	<div>
		{@render children?.()}
	</div>
	{#if selected}
		<Check size={24} />
	{/if}
</Container>
