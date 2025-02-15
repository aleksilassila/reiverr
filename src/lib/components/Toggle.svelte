<script lang="ts">
	import Container from './Container.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		change: boolean;
	}>();

	export let checked: boolean;
	export let label: string | undefined = undefined;
	let input: HTMLInputElement;

	const handleChange = (e: Event) => {
		// @ts-ignore
		checked = e.target?.checked;
		// @ts-ignore
		dispatch('change', e.target?.checked);
	};
</script>

<div class="flex items-center justify-between group">
	<slot>
		{#if label}
			<label class="mr-4 font-medium text-secondary-200 group-focus-within:text-secondary-50">
				{label}
			</label>
		{/if}
	</slot>

	<Container
		class="relative inline-flex items-center cursor-pointer w-min h-min"
		on:enter={(e) => {
			e.detail.options.setFocusedElement = input;
		}}
		on:clickOrSelect={() => input?.click()}
	>
		<input
			type="checkbox"
			bind:checked
			class="sr-only peer"
			bind:this={input}
			on:input={handleChange}
		/>
		<div
			class="w-[3.25rem] h-7 rounded-full bg-secondary-700 peer-checked:bg-primary-500 peer-selectable
        after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px]"
		/>
	</Container>
</div>
