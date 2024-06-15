<script lang="ts">
	import Container from '../../../Container.svelte';
	import classNames from 'classnames';
	import type { NavigateEvent, Selectable } from '../../selectable';
	import type { Writable } from 'svelte/store';

	export let tab: number;
	export let index: number = tab;
	export let openTab: Writable<number>;

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
	class={classNames(
		$$restProps.class,
		'transition-all col-start-1 col-end-1 row-start-1 row-end-1',
		{
			'opacity-0 pointer-events-none absolute inset-0': !active,
			'-translate-x-10': !active && $openTab >= index,
			'translate-x-10': !active && $openTab < index
		}
	)}
	bind:selectable
	on:back
	on:navigate={handleNavigate}
	disabled={!active}
>
	<slot />
</Container>
