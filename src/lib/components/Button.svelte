<script lang="ts">
	import Container from '../../Container.svelte';
	import type { Readable } from 'svelte/store';
	import classNames from 'classnames';
	import AnimatedSelection from './AnimateScale.svelte';

	export let disabled: boolean = false;
	export let focusOnMount: boolean = false;
	export let type: 'primary' | 'secondary' = 'primary';

	let hasFocus: Readable<boolean>;
</script>

<AnimatedSelection hasFocus={$hasFocus}>
	<Container
		bind:hasFocus
		class={classNames(
			'h-12 rounded-lg font-medium tracking-wide flex items-center group',
			{
				'selectable bg-secondary-800 px-6': type === 'primary',
				'border-2 p-1 hover:border-primary-500': type === 'secondary',
				'border-primary-500': type === 'secondary' && $hasFocus,
				'cursor-pointer': !disabled,
				'cursor-not-allowed pointer-events-none opacity-40': disabled
			},
			$$restProps.class
		)}
		on:click
		on:select
		on:clickOrSelect
		on:enter
		{focusOnMount}
	>
		<div
			class={classNames({
				contents: type === 'primary',
				'border-2 border-transparent h-full w-full rounded-md flex items-center px-6':
					type === 'secondary',
				'bg-primary-500 text-secondary-950': type === 'secondary' && $hasFocus,
				'group-hover:bg-primary-500 group-hover:text-secondary-950': type === 'secondary'
			})}
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
		</div>
	</Container>
</AnimatedSelection>
