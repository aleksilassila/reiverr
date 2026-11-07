<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import Container from '../Container.svelte';
	import classNames from 'classnames';
	import { type NavigateEvent, Selectable } from '../../selectable';
	import type { Writable } from 'svelte/store';

	interface Props {
		onBack?: ContainerProps['onBack'];
		tab: number;
		index?: number;
		openTab: Writable<number>;
		direction?: 'horizontal' | 'vertical';
		remount?: boolean;
		children?: Snippet<[{ active: boolean }]>;
		class?: string;
	}

	let {
		tab,
		index = tab,
		openTab,
		direction = 'horizontal',
		remount = true,
		children,
		onBack,
		class: className
	}: Props = $props();

	const selectable = new Selectable();

	let active = $derived(tab === $openTab);
	$effect(() => {
		if (active) selectable.activate();
	});

	function handleNavigate(e: NavigateEvent) {
		// if (e.willLeaveContainer) {
		// 	if (
		// 		(trapFocus === 'all' || trapFocus === 'horizontal') &&
		// 		(detail.direction === 'left' || e.direction === 'right')
		// 	) {
		// 		e.preventNavigation();
		// 		e.stopPropagation();
		// 	} else if (
		// 		(trapFocus === 'all' || trapFocus === 'vertical') &&
		// 		(detail.direction === 'up' || e.direction === 'down')
		// 	) {
		// 		e.preventNavigation();
		// 		e.stopPropagation();
		// 	}
		// }
	}
</script>

{#if !remount || active}
	<Container
		class={classNames(
			'transition-[transform,opacity] overflow-y-auto overflow-x-hidden scrollbar-hide -mx-4 px-4',
			{
				'pointer-events-none opacity-0': !active
			},
			direction === 'horizontal'
				? {
						'-translate-x-10': !active && $openTab >= index,
						'translate-x-10': !active && $openTab < index
					}
				: {
						'-translate-y-10': !active && $openTab >= index,
						'translate-y-10': !active && $openTab < index
					}
		)}
		{selectable}
		{onBack}
		onNavigate={handleNavigate}
		disabled={!active}
	>
		<div class={className}>
			{@render children?.({ active })}
		</div>
	</Container>
{/if}
