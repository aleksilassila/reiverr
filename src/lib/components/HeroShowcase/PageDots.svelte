<script lang="ts">
	import classNames from 'classnames';

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
		<div on:click|preventDefault|stopPropagation={() => onJump(i)}>
			<div
				class={classNames(
					'cursor-pointer transition-transform hover:scale-125 hover:opacity-50 p-1.5 xl:p-2.5',
					{
						'opacity-50': i === index,
						'opacity-20': i !== index
					}
				)}
			>
				<div class={'bg-zinc-200 rounded-full w-2 h-2 xl:w-2.5 xl:h-2.5'} />
			</div>
		</div>
	{/each}
</div>
