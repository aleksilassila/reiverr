<script lang="ts">
	import Container from '../../Container.svelte';
	import type { FormEventHandler, HTMLInputTypeAttribute } from 'svelte/elements';
	import { createEventDispatcher } from 'svelte';
	import { PLATFORM_TV } from '../constants';
	import classNames from 'classnames';

	export let value = '';
	export let type: HTMLInputTypeAttribute = 'text';

	const dispatch = createEventDispatcher<{
		change: string;
	}>();
	let input: HTMLInputElement;

	const handleChange = (e: Event) => {
		value = e.target?.value;
		console.log('e', e);
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
>
	<label class="text-sm text-zinc-300 mb-1">
		<slot>Label</slot>
	</label>
	<input
		class={classNames('bg-highlight-background px-4 py-1.5 rounded-lg', {
			selected: hasFocus,
			unselected: !hasFocus
		})}
		{type}
		{value}
		on:input={handleChange}
		bind:this={input}
	/>
</Container>
