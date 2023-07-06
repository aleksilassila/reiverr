<script lang="ts">
	import classNames from 'classnames';
	import RadarrIcon from '../svgs/RadarrIcon.svelte';

	type Stat = {
		title: string;
		value: string;
	};

	export let title: string;
	export let subtitle: string;
	export let stats: Stat[] = [];

	export let color: string = '#fde68a20';
	export let large = false;
</script>

<div
	class={classNames('relative w-full mx-auto px-6 rounded-xl overflow-hidden', {
		'h-16': !large,
		'h-28': large
	})}
	style={'background-color: ' + color + ';'}
>
	<div class="absolute left-0 inset-y-0 w-[70%] bg-[#ffffff22]" />
	{#if large}
		<slot name="icon" />
	{/if}
	<div
		class={classNames('relative z-[1] flex flex-1 h-full', {
			'justify-between items-center': !large,
			'flex-col justify-center gap-2': large
		})}
	>
		<div class="flex flex-col">
			<h3 class="text-zinc-400 font-medium text-xs tracking-wider">{subtitle}</h3>
			<a href="/" class="text-zinc-200 font-bold text-xl tracking-wide">{title}</a>
		</div>
		<div class="flex gap-8">
			{#each stats as { title, value }}
				<div class="flex flex-col items-center gap-0.5">
					<h3 class="uppercase text-zinc-400 font-medium text-xs tracking-wider">{title}</h3>
					<div class="font-medium text-sm">{value}</div>
				</div>
			{/each}
		</div>
	</div>
</div>
