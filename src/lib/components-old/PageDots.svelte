<script lang="ts">
	import classNames from 'classnames';
	import { DotFilled } from 'radix-icons-svelte';

	export let index: number;
	export let length: number;
	export let onJump: (index: number) => void;
	export let onPrevious: () => void = () => {};
	export let onNext: () => void = () => {};
</script>

<div class="flex gap-1">
	{#each Array.from({ length }) as _, i}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<!-- <div
			on:click={() => onJump(i)}
			class={classNames(
				'py-2 flex-1 w-6 transition-transform hover:scale-y-150 hover:opacity-50 cursor-pointer',
				{
					'opacity-50': i === index,
					'opacity-20': i !== index
				}
			)}
		>
			<div class={classNames('h-[3px] bg-zinc-200 rounded-full', {})} />
		</div> -->
		<div on:click={() => onJump(i)}>
			<DotFilled
				class={classNames(
					'transition-transform hover:scale-150 hover:opacity-50 cursor-pointer text-zinc-200',
					{
						'opacity-50': i === index,
						'opacity-20': i !== index
					}
				)}
				size={20}
			/>
		</div>
	{/each}
</div>
