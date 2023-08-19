<script lang="ts">
	import classNames from 'classnames';
	import { CaretDown } from 'radix-icons-svelte';

	export let value: any = '';
	export let disabled = false;
	export let loading = false;
</script>

<div
	class={classNames(
		'relative w-max min-w-[8rem] h-min bg-zinc-600 bg-opacity-20 rounded-lg overflow-hidden',
		{
			'opacity-50': disabled,
			'animate-pulse pointer-events-none': loading
		}
	)}
>
	<select
		on:change
		bind:value
		class={classNames(
			'relative appearance-none p-1 pl-3 pr-8 selectable border border-zinc-800 bg-transparent rounded-lg w-full z-[1]',
			{
				'cursor-not-allowed pointer-events-none': disabled
			}
		)}
	>
		<slot />
	</select>
	<div class="absolute inset-y-0 right-2 flex items-center justify-center">
		<CaretDown size={20} />
	</div>
</div>
