<script lang="ts">
	import { Selectable } from '$lib/selectable';
	import Container from './Container.svelte';

	import { Check } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import AnimateScale from './AnimateScale.svelte';

	interface Props {
		onChange?: (detail: boolean) => void;
		checked: boolean;
	}

	let { checked = $bindable(), onChange }: Props = $props();
	const selectable = new Selectable();
	const hasFocus = selectable.hasFocus;
	let input: HTMLInputElement | undefined = $state();

	const handleChange = (e: Event) => {
		checked = (e.target as HTMLInputElement).checked;
		onChange?.(checked);
	};
</script>

<AnimateScale hasFocus={$hasFocus}>
	<Container
		onEnter={(e) => {
			if (input) e.focusElement(input);
		}}
		onClickOrSelect={() => input?.click()}
		{selectable}
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
				oninput={handleChange}
			/>
			<Check class="opacity-0 peer-checked:opacity-100" size={24} />
			<!--		<div-->
			<!--			class="w-11 h-6 rounded-full peer bg-zinc-600 bg-opacity-20 peer-checked:bg-amber-200 peer-checked:bg-opacity-30 peer-selectable-->
			<!--        after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px]"-->
			<!--		/>-->
		</div>
	</Container>
</AnimateScale>
