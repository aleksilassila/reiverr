<script lang="ts">
	import Container from '../../../Container.svelte';
	import classNames from 'classnames';
	import { TriangleRight } from 'radix-icons-svelte';
	import type { Readable } from 'svelte/store';
	import AnimateScale from '../AnimateScale.svelte';

	export let episodeNumber: number;
	export let episodeName: string;
	export let backdropUrl: string;
	export let handlePlay: () => void = () => {};

	let hasFocus: Readable<boolean>;
</script>

<AnimateScale hasFocus={$hasFocus}>
	<Container
		class={classNames(
			'w-[420px] h-[236.25px] ',
			'flex flex-col shrink-0',
			'overflow-hidden rounded-xl cursor-pointer group relative px-4 py-3 selectable'
		)}
		on:select={handlePlay}
		on:enter
		on:mount
		bind:hasFocus
		focusOnClick
	>
		<div class="flex-1 flex flex-col justify-end z-10">
			<h2 class="text-zinc-300 font-medium">Episode {episodeNumber}</h2>
			<h1 class="text-zinc-100 text-lg font-medium line-clamp-2">{episodeName}</h1>
		</div>
		<div
			class="absolute inset-0 bg-center bg-cover"
			style={`background-image: url('${backdropUrl}')`}
		/>
		<div
			class="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent via-40% to-transparent"
		/>
		{#if handlePlay}
			<div
				class={classNames(
					'group-hover:opacity-100 absolute inset-0 z-20 flex items-center justify-center'
				)}
			>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div
					class={classNames('rounded-full p-2.5 cursor-pointer', {
						// 'bg-primary-500 text-black': hasFocus,
						// 'bg-zinc-900/90 hover:bg-primary-500 hover:text-black': !hasFocus
						'bg-zinc-900/90 hover:bg-primary-500 hover:text-black': true
					})}
					on:click={handlePlay}
				>
					<TriangleRight size={32} />
				</div>
			</div>
		{/if}
	</Container>
</AnimateScale>
