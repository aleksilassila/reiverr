<script lang="ts">
	import classNames from 'classnames';
	import { CaretDown } from 'radix-icons-svelte';
	import Container from '../../Container.svelte';

	export let value: any = '';
	export let options: { value: any; text?: string }[] = [];
	export let disabled = false;
	export let loading = false;

	let select: HTMLSelectElement;
</script>

<Container
	on:clickOrSelect={() => select.click()}
	class={classNames(
		'relative w-max min-w-[8rem] h-min bg-zinc-600 bg-opacity-20 rounded-lg overflow-hidden',
		{
			'opacity-50': disabled,
			'animate-pulse pointer-events-none': loading
		}
	)}
>
	<select
		bind:this={select}
		on:change
		bind:value
		class={classNames(
			'relative appearance-none p-1 pl-3 pr-8 selectable border border-zinc-800 bg-transparent rounded-lg w-full z-[1]',
			{
				'cursor-not-allowed pointer-events-none': disabled
			}
		)}
	>
		{#each options as { value, text }}
			<option {value}>{text ?? value}</option>
		{/each}
	</select>
	<div class="absolute inset-y-0 right-2 flex items-center justify-center">
		<CaretDown size={20} />
	</div>
</Container>
