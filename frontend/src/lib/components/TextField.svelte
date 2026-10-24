<script lang="ts">
	import Container from './Container.svelte';
	import type { FormEventHandler, HTMLInputTypeAttribute } from 'svelte/elements';
	import { type ComponentType, createEventDispatcher } from 'svelte';
	import classNames from 'classnames';
	import Spinner from './Utils/Spinner.svelte';
	import { Check, Cross1 } from 'radix-icons-svelte';
	import type { Selectable } from '../selectable';

	export let value = '';
	export let placeholder: string = '';
	export let type: HTMLInputTypeAttribute = 'text';
	/** The surface; `type` is the input's */
	export let variant: 'primary' | 'primary-dark' = 'primary';
	export let isValid: Promise<boolean> | boolean | undefined = undefined;
	let icon: ComponentType | undefined = undefined;

	$: {
		if (isValid instanceof Promise) {
			icon = Spinner;
			isValid.then((valid) => {
				icon = valid ? Check : Cross1;
			});
		} else if (isValid === false) {
			icon = Cross1;
		} else if (isValid === true) {
			icon = Check;
		} else {
			icon = undefined;
		}
	}

	const dispatch = createEventDispatcher<{
		change: string;
	}>();
	let input: HTMLInputElement;

	const handleChange = (e: Event) => {
		// @ts-ignore
		value = e.target?.value;
		// @ts-ignore
		dispatch('change', e.target?.value);
	};

	// Navigating onto the field focuses the container, not the input, which on a TV
	// would open the keyboard; enter or a click focuses the input, enter or back leaves it.
	// While the input has the focus the arrow keys move the caret and shift+enter is the
	// input's, so they do not reach the navigation
	const isEditing = () => document.activeElement === input;

	function toggleEditing(selectable: Selectable) {
		if (isEditing()) selectable.focus();
		else input?.focus();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key.startsWith('Arrow') || (e.key === 'Enter' && e.shiftKey)) e.stopPropagation();
	}
</script>

<Container
	on:enter
	on:clickOrSelect={({ detail }) => toggleEditing(detail)}
	on:back={(e) => {
		if (!isEditing()) return;
		e.detail.selectable.focus();
		e.detail.stopPropagation();
	}}
	class={classNames('group flex flex-col', $$restProps.class)}
	focusOnClick
>
	<label class="text-secondary-300 font-medium tracking-wide text-sm mb-1">
		<slot>Label</slot>
	</label>
	<div class="relative flex flex-col">
		<input
			class={classNames('selectable group-focus-within:border-primary-500 px-6 py-2 rounded-lg', {
				'bg-secondary-800': variant === 'primary',
				'bg-primary-900': variant === 'primary-dark'
			})}
			on:blur
			on:keydown={handleKeyDown}
			{type}
			{value}
			on:input={handleChange}
			bind:this={input}
			{placeholder}
		/>
		{#if icon}
			<div class="absolute inset-y-0 right-4 flex items-center justify-center">
				<svelte:component this={icon} size={19} />
			</div>
		{/if}
	</div>
</Container>
