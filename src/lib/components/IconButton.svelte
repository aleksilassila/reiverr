<script lang="ts">
	import classNames from 'classnames';
	import Container from '../../Container.svelte';
	import type { ComponentType } from 'svelte';
	import type { Readable } from 'svelte/store';
	import AnimateScale from './AnimateScale.svelte';

	export let icon: ComponentType;
	export let disabled = false;
	export let type: 'primary' | 'secondary' | 'primary-dark' = 'primary';
	export let size: 'md' | 'sm' | number = 'md';
	export let mouseOnly = false;

	let hasFocus: Readable<boolean>;
</script>

{#if !mouseOnly}
	<AnimateScale hasFocus={$hasFocus}>
		<Container
			bind:hasFocus
			class={classNames(
				'rounded-xl font-medium tracking-wide flex items-center overflow-hidden',
				{
					'h-12': size === 'md',
					'px-4': size === 'md',
					'h-10': size === 'sm',
					'px-3': size === 'sm'
				},
				{
					'bg-secondary-800': type === 'primary' && !$hasFocus,
					'bg-primary-900': type === 'primary-dark' && !$hasFocus,
					'bg-primary-500 text-black': $hasFocus
				},
				$$restProps.class
			)}
			on:clickOrSelect
		>
			<svelte:component this={icon} size={19} />
			<div
				class={classNames('', {
					'max-w-0 opacity-0': !$hasFocus,
					'max-w-[calc(100%-19px)] opacity-100': $hasFocus
				})}
			>
				<span class="ml-2">
					<slot />
				</span>
			</div>
		</Container>
	</AnimateScale>
{:else}
	<button
		class="cursor-pointer hover:scale-125 transition-transform p-1 flex items-center justify-center"
		on:click
	>
		<svelte:component this={icon} size={isNaN(Number(size)) ? 19 : size} />
	</button>
{/if}
