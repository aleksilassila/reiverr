<script lang="ts">
	import classNames from 'classnames';
	import { createEventDispatcher } from 'svelte';

	const dispatcher = createEventDispatcher();

	export let type: 'text' | 'number' = 'text';
	export let value: any = type === 'text' ? '' : 0;
	export let placeholder = '';

	function handleChange(event: Event) {
		value = (event.target as HTMLInputElement).value;
		dispatcher('change', value);
	}

	const baseStyles =
		'appearance-none p-1 px-3 selectable border border-zinc-800 rounded-lg bg-zinc-600 bg-opacity-20 text-zinc-200 placeholder:text-zinc-700';
</script>

<div class="relative">
	{#if type === 'text'}
		<input
			type="text"
			{placeholder}
			bind:value
			on:input={handleChange}
			class={classNames(baseStyles, $$restProps.class)}
		/>
	{:else if type === 'number'}
		<input
			type="number"
			{placeholder}
			bind:value
			on:input={handleChange}
			class={classNames(baseStyles, 'w-28', $$restProps.class)}
		/>
	{/if}
</div>
