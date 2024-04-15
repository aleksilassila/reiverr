<svelte:options accessors />

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		Selectable,
		type EnterEvent,
		type NavigateEvent,
		type KeyEvent,
		type Registrar
	} from './lib/selectable';
	import classNames from 'classnames';

	const dispatch = createEventDispatcher<{
		click: MouseEvent;
		select: null;
		clickOrSelect: null;
		enter: EnterEvent;
		mount: Selectable;
		navigate: NavigateEvent;
		back: KeyEvent;
		playPause: KeyEvent;
	}>();

	export let name: string = '';
	export let direction: 'vertical' | 'horizontal' | 'grid' = 'vertical';
	export let gridCols: number = 0;
	export let focusOnMount = false;
	export let canFocusEmpty = true;
	export let trapFocus = false;
	export let debugOutline = false;
	export let focusOnClick = false;

	export let registrars: Registrar[] = [];
	export let registrar: Registrar = () => {};

	export let active = true;

	const { registerer, ...rest } = new Selectable(name)
		.setDirection(direction === 'grid' ? 'horizontal' : direction)
		.setGridColumns(gridCols)
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
		.setOnBack((selectable, options) => {
			function stopPropagation() {
				options.propagate = false;
			}

			function bubble() {
				options.propagate = true;
			}

			dispatch('back', { selectable, options, stopPropagation, bubble });
		})
		.setOnPlayPause((selectable, options) => {
			function stopPropagation() {
				options.propagate = false;
			}

			function bubble() {
				options.propagate = true;
			}

			dispatch('playPause', { selectable, options, stopPropagation, bubble });
		})
		.getStores();

	$: registrars.forEach((r) => r(rest.container));
	$: registrar(rest.container);

	export const selectable = rest.container;
	export const hasFocus = rest.hasFocus;
	export const hasFocusWithin = rest.hasFocusWithin;
	export const focusIndex = rest.focusIndex;

	export let tag = 'div';

	$: selectable.setIsActive(active);
	$: selectable.setGridColumns(gridCols);

	function handleClick(e: MouseEvent) {
		if (focusOnClick) {
			selectable.focus();
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
	<slot
		hasFocus={$hasFocus}
		hasFocusWithin={$hasFocusWithin}
		focusIndex={$focusIndex}
		{selectable}
	/>
</svelte:element>
