<svelte:options accessors />

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		type NavigationActions,
		Selectable,
		type EnterEvent,
		type NavigateEvent
	} from './lib/selectable';
	import classNames from 'classnames';

	const dispatch = createEventDispatcher<{
		click: MouseEvent;
		select: null;
		clickOrSelect: null;
		enter: EnterEvent;
		mount: Selectable;
		navigate: NavigateEvent;
	}>();

	export let name: string = '';
	export let direction: 'vertical' | 'horizontal' | 'grid' = 'vertical';
	export let gridCols: number = 0;
	export let focusOnMount = false;
	export let canFocusEmpty = true;
	export let trapFocus = false;
	export let debugOutline = false;
	export let focusOnClick = false;

	export let active = true;

	export let handleNavigateOut: NavigationActions = {};

	const { registerer, ...rest } = new Selectable(name)
		.setDirection(direction === 'grid' ? 'horizontal' : direction)
		.setGridColumns(gridCols)
		.setNavigationActions(handleNavigateOut)
		.setTrapFocus(trapFocus)
		.setCanFocusEmpty(canFocusEmpty)
		.setOnFocus((selectable, options) => {
			function stopPropagation() {
				options.propagate = false;
			}

			dispatch('enter', { selectable, options, stopPropagation });
		})
		.setOnNavigate((selectable, options, willLeaveContainer) => {
			function preventNavigation() {
				options.preventNavigation = true;
			}

			function stopPropagation() {
				options.propagate = false;
			}

			dispatch('navigate', {
				selectable,
				options,
				willLeaveContainer,
				preventNavigation,
				stopPropagation,
				direction: options.direction
			});
		})
		.setOnSelect(() => {
			dispatch('select');
			dispatch('clickOrSelect');
		})
		.getStores();
	export const container = rest.container;
	export const hasFocus = rest.hasFocus;
	export const hasFocusWithin = rest.hasFocusWithin;
	export const focusIndex = rest.focusIndex;

	export let tag = 'div';

	$: container.setIsActive(active);
	$: container.setGridColumns(gridCols);

	function handleClick(e: MouseEvent) {
		if (focusOnClick) {
			container.focus();
		}

		dispatch('click', e);
		dispatch('clickOrSelect');
	}

	onMount(() => {
		rest.container._mountSelectable(focusOnMount);

		dispatch('mount', rest.container);

		return () => {
			rest.container._unmountContainer();
		};
	});
</script>

<svelte:element
	this={tag}
	on:click={handleClick}
	on:mousemove
	tabindex={active ? 0 : -1}
	{...$$restProps}
	class={classNames($$restProps.class, {
		'outline-none': debugOutline === false
	})}
	use:registerer
>
	<slot hasFocus={$hasFocus} hasFocusWithin={$hasFocusWithin} focusIndex={$focusIndex} />
</svelte:element>
