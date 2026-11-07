<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';

	type Props = Pick<
		SvelteHTMLElements['input'],
		'onmouseup' | 'onmousedown' | 'ontouchstart' | 'ontouchend'
	> & {
		min?: number;
		max?: number;
		step?: number;
		primaryValue?: number;
		secondaryValue?: number;
	};

	let {
		min = 0,
		max = 100,
		step = 0.01,
		primaryValue = $bindable(0),
		secondaryValue = 0,
		onmouseup,
		onmousedown,
		ontouchstart,
		ontouchend
	}: Props = $props();

	let progressBarOffset = $state(0);
</script>

<div class="h-1 relative group">
	<div class="h-full relative px-[0.5rem]">
		<div class="h-full bg-zinc-200 bg-opacity-20 rounded-full overflow-hidden relative">
			<!-- Secondary progress -->
			<div
				class="h-full bg-zinc-200 bg-opacity-20 absolute top-0"
				style="width: {(secondaryValue / max) * 100}%;"
			></div>

			<!-- Primary progress -->
			<div
				class="h-full bg-amber-300 absolute top-0"
				style="width: {(primaryValue / max) * 100}%;"
				bind:offsetWidth={progressBarOffset}
			></div>
		</div>

		<div
			class="absolute w-3 h-3 bg-amber-200 rounded-full transform mx-2 -translate-x-1/2 -translate-y-1/2 top-1/2 cursor-pointer
                    drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-100"
			style="left: {progressBarOffset}px;"
		></div>
	</div>

	<input
		type="range"
		class="w-full absolute -top-0.5 cursor-pointer h-2 opacity-0"
		{min}
		{max}
		{step}
		bind:value={primaryValue}
		{onmouseup}
		{onmousedown}
		{ontouchstart}
		{ontouchend}
	/>
</div>
