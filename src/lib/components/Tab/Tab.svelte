<script lang="ts">
	import Container from '../Container.svelte';
	import classNames from 'classnames';
	import type { NavigateEvent, Selectable } from '../../selectable';
	import type { Writable } from 'svelte/store';

	export let tab: number;
	export let index: number = tab;
	export let openTab: Writable<number>;
	export let size: 'hug' | 'stretch' = 'hug';
	export let direction: 'horizontal' | 'vertical' = 'horizontal';

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

<Container
	class={classNames('col-start-1 col-end-1 row-start-1 row-end-1', {
		'absolute pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2':
			!active && size === 'hug',
		'absolute pointer-events-none inset-0': !active && size === 'stretch',
		'': active
	})}
	bind:selectable
	on:back
	on:navigate={handleNavigate}
	disabled={!active}
>
	<div
		class={classNames(
			$$restProps.class,
			'transition-[transform,opacity]',
			{
				'opacity-0 pointer-events-none': !active
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
	>
		<slot />
	</div>
</Container>
