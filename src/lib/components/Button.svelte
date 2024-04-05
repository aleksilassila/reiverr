<script lang="ts">
	import Container from '../../Container.svelte';
	import type { Readable } from 'svelte/store';
	import classNames from 'classnames';

	export let inactive: boolean = false;
	export let focusOnMount: boolean = false;

	let hasFoucus: Readable<boolean>;
</script>

<Container
	bind:hasFocus={hasFoucus}
	class={classNames(
		'px-6 py-2 rounded-lg font-medium tracking-wide flex items-center',
		{
			'bg-stone-200 text-stone-900': $hasFoucus,
			'hover:bg-stone-200 hover:text-stone-900': true,
			'bg-stone-800/50': !$hasFoucus,
			'cursor-pointer': !inactive,
			'cursor-not-allowed pointer-events-none opacity-40': inactive
		},
		$$restProps.class
	)}
	on:click
	on:select
	on:clickOrSelect
	let:hasFocus
	{focusOnMount}
>
	{#if $$slots.icon}
		<div class="mr-2">
			<slot name="icon" />
		</div>
	{/if}
	<slot {hasFocus} />
	{#if $$slots['icon-after']}
		<div class="ml-2">
			<slot name="icon-after" />
		</div>
	{/if}
</Container>
