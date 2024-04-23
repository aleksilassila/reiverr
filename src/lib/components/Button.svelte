<script lang="ts">
	import Container from '../../Container.svelte';
	import type { Readable } from 'svelte/store';
	import classNames from 'classnames';
	import AnimatedSelection from './AnimateScale.svelte';

	export let inactive: boolean = false;
	export let focusOnMount: boolean = false;
	export let style: 'primary' | 'secondary' = 'primary';

	let hasFocus: Readable<boolean>;
</script>

<AnimatedSelection hasFocus={$hasFocus}>
	<Container
		bind:hasFocus
		class={classNames(
			'px-6 py-2 rounded-lg font-medium tracking-wide flex items-center selectable',
			{
				'bg-secondary-700': style === 'primary',
				'cursor-pointer': !inactive,
				'cursor-not-allowed pointer-events-none opacity-40': inactive
			},
			$$restProps.class
		)}
		on:click
		on:select
		on:clickOrSelect
		on:enter
		let:hasFocus
		{focusOnMount}
	>
		{#if $$slots.icon}
			<div class="mr-2">
				<slot name="icon" />
			</div>
		{/if}
		<div class="flex-1 text-center text-nowrap">
			<slot {hasFocus} />
		</div>
		{#if $$slots['icon-after']}
			<div class="ml-2">
				<slot name="icon-after" />
			</div>
		{/if}
	</Container>
</AnimatedSelection>
