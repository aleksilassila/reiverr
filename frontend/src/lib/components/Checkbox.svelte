<script lang="ts">
	import Container from './Container.svelte';
	import { createEventDispatcher } from 'svelte';
	import { Check } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import AnimateScale from './AnimateScale.svelte';
	import type { Readable } from 'svelte/store';

	export type CheckboxChangeEvent = CustomEvent<boolean>;

	const dispatch = createEventDispatcher<{
		change: boolean;
	}>();

	export let checked: boolean;
	let hasFocus: Readable<boolean>;
	let input: HTMLInputElement;

	const handleChange = (e: Event) => {
		checked = e.target?.checked;
		dispatch('change', e.target?.checked);
	};
</script>

<AnimateScale hasFocus={$hasFocus}>
	<Container
		on:enter={(e) => {
			e.detail.options.setFocusedElement = input;
		}}
		on:clickOrSelect={() => input?.click()}
		bind:hasFocus
		class={classNames(
			'border-2 rounded-xl w-9 h-9 cursor-pointer flex items-center justify-center transition-colors p-[3px]',
			{
				'border-secondary-200 focus-within:border-primary-500': checked,
				'focus-within:border-primary-500': !checked
			}
		)}
	>
		<div
			class={classNames('flex items-center justify-center w-full h-full rounded-lg', {
				'text-secondary-200 focus-within:bg-primary-500 focus-within:text-secondary-800': checked
			})}
		>
			<input
				type="checkbox"
				bind:checked
				class="sr-only peer"
				bind:this={input}
				on:input={handleChange}
			/>
			<Check class="opacity-0 peer-checked:opacity-100" size={24} />
			<!--		<div-->
			<!--			class="w-11 h-6 rounded-full peer bg-zinc-600 bg-opacity-20 peer-checked:bg-amber-200 peer-checked:bg-opacity-30 peer-selectable-->
			<!--        after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px]"-->
			<!--		/>-->
		</div>
	</Container>
</AnimateScale>
