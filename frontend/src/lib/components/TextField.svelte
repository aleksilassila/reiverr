<script lang="ts">
	import type { ContainerProps } from '$lib/components/Container.type';
	import Container from './Container.svelte';
	import type { FormEventHandler, HTMLInputTypeAttribute } from 'svelte/elements';
	import { type Snippet } from 'svelte';
	import type { IconComponent } from '$lib/components/icon.type';
	import classNames from 'classnames';
	import Spinner from './Utils/Spinner.svelte';
	import { Check, Cross1 } from 'radix-icons-svelte';
	import type { Selectable } from '../selectable';

	interface Props {
		onEnter?: ContainerProps['onEnter'];
		onChange?: (detail: string) => void;
		value?: string;
		placeholder?: string;
		type?: HTMLInputTypeAttribute;
		/** The surface; `type` is the input's */
		variant?: 'primary' | 'primary-dark';
		isValid?: Promise<boolean> | boolean | undefined;
		children?: Snippet;
		class?: string;
	}

	let {
		value = $bindable(''),
		placeholder = '',
		type = 'text',
		variant = 'primary',
		isValid = undefined,
		children,
		onChange,
		onEnter,
		class: className
	}: Props = $props();
	let icon: IconComponent | undefined = $state(undefined);

	$effect(() => {
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
	});

	let input: HTMLInputElement | undefined = $state();

	const handleChange = (e: Event) => {
		// @ts-ignore
		value = e.target?.value;
		// @ts-ignore
		onChange?.(e.target?.value);
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
	{onEnter}
	onClickOrSelect={(e) => toggleEditing(e)}
	onBack={(e) => {
		if (!isEditing()) return;
		e.selectable.focus();
		e.stopPropagation();
	}}
	class={classNames('group flex flex-col', className)}
	focusOnClick
>
	<label class="text-secondary-300 font-medium tracking-wide text-sm mb-1">
		{#if children}{@render children()}{:else}Label{/if}
	</label>
	<div class="relative flex flex-col">
		<input
			class={classNames('selectable group-focus-within:border-primary-500 px-6 py-2 rounded-xl', {
				'bg-secondary-800': variant === 'primary',
				'bg-primary-900': variant === 'primary-dark'
			})}
			onkeydown={handleKeyDown}
			{type}
			{value}
			oninput={handleChange}
			bind:this={input}
			{placeholder}
		/>
		{#if icon}
			{@const SvelteComponent = icon}
			<div class="absolute inset-y-0 right-4 flex items-center justify-center">
				<SvelteComponent size={19} />
			</div>
		{/if}
	</div>
</Container>
