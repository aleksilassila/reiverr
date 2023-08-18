<script lang="ts">
	import classNames from 'classnames';
	import { CaretDown } from 'radix-icons-svelte';

	export let value: any = '';
	export let disabled = false;
</script>

<div
	class={classNames('relative w-max min-w-[8rem]', {
		'opacity-50': disabled
	})}
>
	<select
		on:change
		bind:value
		class={classNames(
			'appearance-none p-1 pl-3 pr-8 selectable border border-zinc-800 rounded-lg bg-zinc-600 bg-opacity-20 w-full',
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
