<script lang="ts">
	import type { Snippet } from 'svelte';
	import Container from './Container.svelte';

	interface Props {
		onChange?: (detail: boolean) => void;
		checked: boolean;
		label?: string | undefined;
		children?: Snippet;
	}

	let { checked = $bindable(), label = undefined, children, onChange }: Props = $props();
	let input: HTMLInputElement | undefined = $state();

	const handleChange = (e: Event) => {
		// @ts-ignore
		checked = e.target?.checked;
		// @ts-ignore
		onChange?.(e.target?.checked);
	};
</script>

<div class="flex items-center justify-between group">
	{#if children}{@render children()}{:else}
		{#if label}
			<label class="mr-4 font-medium text-secondary-200 group-focus-within:text-secondary-50">
				{label}
			</label>
		{/if}
	{/if}

	<Container
		class="relative inline-flex items-center cursor-pointer w-min h-min"
		onEnter={(e) => {
			if (input) e.options.setFocusedElement = input;
		}}
		onClickOrSelect={() => input?.click()}
	>
		<input
			type="checkbox"
			bind:checked
			class="sr-only peer"
			bind:this={input}
			oninput={handleChange}
		/>
		<div
			class="w-[3.25rem] h-7 rounded-full bg-secondary-700 peer-checked:bg-primary-500 peer-selectable
        after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px]"
		></div>
	</Container>
</div>
