<script lang="ts">
	import Container from '../Container.svelte';
	import classNames from 'classnames';
	import type { NavigateEvent, Selectable } from '../../selectable';
	import type { Writable } from 'svelte/store';

	export let tab: number;
	export let index: number = tab;
	export let openTab: Writable<number>;
	export let direction: 'horizontal' | 'vertical' = 'horizontal';
	export let remount = true;

	let selectable: Selectable;

	$: active = tab === $openTab;
	$: if (active) selectable?.activate();

	function handleNavigate({ detail }: CustomEvent<NavigateEvent>) {
		// if (detail.willLeaveContainer) {
		// 	if (
		// 		(trapFocus === 'all' || trapFocus === 'horizontal') &&
		// 		(detail.direction === 'left' || detail.direction === 'right')
		// 	) {
		// 		detail.preventNavigation();
		// 		detail.stopPropagation();
		// 	} else if (
		// 		(trapFocus === 'all' || trapFocus === 'vertical') &&
		// 		(detail.direction === 'up' || detail.direction === 'down')
		// 	) {
		// 		detail.preventNavigation();
		// 		detail.stopPropagation();
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
		bind:selectable
		on:back
		on:navigate={handleNavigate}
		disabled={!active}
	>
		<div class={$$restProps.class}>
			<slot {active} />
		</div>
	</Container>
{/if}
