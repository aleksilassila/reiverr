<script lang="ts">
	import classNames from 'classnames';

	type Stat = {
		title: string;
		value: string;
	};

	export let title: string;
	export let subtitle: string;
	export let stats: Stat[] = [];
	export let href = '#';
	export let fillPercentage = 0;

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
	<div class="absolute left-0 inset-y-0 bg-[#ffffff22]" style={'width: ' + fillPercentage + '%;'} />
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
			<a target="_blank" {href} class="text-zinc-200 font-bold text-xl tracking-wide">{title}</a>
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
