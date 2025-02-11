<script lang="ts">
	import classNames from 'classnames';
	import Container from './Container.svelte';

	export let disabled = false;
	export let type: 'floating' | 'solid' = 'floating';
	export let container = false;

	// const getClass = (hasFocus?: boolean) => type === 'floating' ? classNames(
	// 		'text-zinc-300 hover:text-zinc-50 p-1 flex items-center justify-center rounded-sm flex-shrink-0 bg-transparent',
	// 		{
	// 			'opacity-30 cursor-not-allowed pointer-events-none': disabled,
	// 			'cursor-pointer': !disabled
	// 		},
	// 		$$restProps.class
	// 	) : classNames(
	// 			'group-hover:bg-primary-500 group-hover:text-secondary-800 rounded-full p-3',
	// 			{
	// 				'bg-primary-500 text-secondary-800': hasFocus
	// 			},
	// 			$$restProps.class
	// 		)
</script>

{#if !container}
	<button
		class={classNames(
			'text-secondary-400 hover:text-secondary-200 p-1 flex items-center justify-center rounded-sm flex-shrink-0 bg-transparent',
			{
				'opacity-30 cursor-not-allowed pointer-events-none': disabled,
				'cursor-pointer': !disabled
			},
			$$restProps.class
		)}
		on:click
	>
		<slot />
	</button>
{:else}
	<Container on:clickOrSelect let:hasFocus class="cursor-pointer group">
		<div
			class={classNames(
				'group-hover:bg-primary-500 group-hover:text-secondary-800 rounded-full p-3',
				{
					'bg-primary-500 text-secondary-800': hasFocus
				}
			)}
		>
			<slot />
		</div>
	</Container>
{/if}
