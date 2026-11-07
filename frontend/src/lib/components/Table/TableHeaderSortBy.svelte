<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import { Selectable } from '$lib/selectable';
	import Container from '../Container.svelte';
	import classNames from 'classnames';
	import { ChevronDown, ChevronUp } from 'radix-icons-svelte';
	import TableHeaderCell from './TableHeaderCell.svelte';

	interface Props {
		onClickOrSelect?: ContainerProps['onClickOrSelect'];
		icon?: undefined | 'asc' | 'desc';
		children?: Snippet;
	}

	let { icon = undefined, children, onClickOrSelect }: Props = $props();
	const selectable = new Selectable();
	const hasFocus = selectable.hasFocus;
</script>

<TableHeaderCell>
	<Container
		{selectable}
		{onClickOrSelect}
		focusOnClick
		class={classNames(
			'flex items-center rounded-full py-1 cursor-pointer select-none font-semibold float-left',
			{
				'bg-primary-500 text-secondary-800 px-3': $hasFocus
			}
		)}
	>
		{@render children?.()}
		{#if icon}
			{@const SvelteComponent = icon === 'desc' ? ChevronDown : ChevronUp}
			<SvelteComponent size={19} class="ml-2" />
		{/if}
	</Container>
</TableHeaderCell>
