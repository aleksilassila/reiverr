<script lang="ts">
	import Container from './Container.svelte';
	import type { FormEventHandler, HTMLInputTypeAttribute } from 'svelte/elements';
	import { type ComponentType, createEventDispatcher } from 'svelte';
	import { PLATFORM_TV } from '../constants';
	import classNames from 'classnames';
	import Spinner from './Utils/Spinner.svelte';
	import { Check, Cross1 } from 'radix-icons-svelte';

	export let value = '';
	export let placeholder: string = '';
	export let type: HTMLInputTypeAttribute = 'text';
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
</script>

<Container
	on:enter={(e) => {
		if (!PLATFORM_TV) {
			e.detail.options.setFocusedElement = input;
		}
	}}
	on:clickOrSelect={() => input?.focus()}
	class={classNames('flex flex-col', $$restProps.class)}
	let:hasFocus
	focusOnClick
>
	<label class="text-secondary-300 font-medium tracking-wide text-sm mb-1">
		<slot>Label</slot>
	</label>
	<div class="relative flex flex-col">
		<input
			class={classNames('bg-primary-900 px-6 py-2 rounded-lg', {
				selected: hasFocus,
				unselected: !hasFocus
			})}
			on:blur
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
