<script lang="ts">
	import Container from '../../Container.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		change: boolean;
	}>();

	export let checked: boolean;
	let input: HTMLInputElement;

	const handleChange = (e: Event) => {
		checked = e.target?.checked;
		dispatch('change', e.target?.checked);
	};
</script>

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
		class="w-11 h-6 rounded-full peer bg-zinc-600 bg-opacity-20 peer-checked:bg-amber-200 peer-checked:bg-opacity-30 peer-selectable
        after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px]"
	/>
</Container>
