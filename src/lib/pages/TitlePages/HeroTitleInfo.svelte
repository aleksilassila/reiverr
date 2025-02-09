<script lang="ts">
	import classNames from 'classnames';
	import { DotFilled } from 'radix-icons-svelte';

	export let title: string;
	export let properties: {
		href?: string;
		label?: string;
	}[] = [];
	export let overview: string;
	export let onClickTitle: (() => void) | undefined = undefined;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class={classNames('text-left font-medium tracking-wider text-stone-200 mt-1', {
		'text-4xl sm:text-5xl 2xl:text-6xl': title.length || 0 < 15,
		'text-3xl sm:text-4xl 2xl:text-5xl': title.length || 0 >= 15,
		'hover:text-amber-200 cursor-pointer': !!onClickTitle
	})}
	on:click={onClickTitle}
>
	{title}
</div>

<div
	class="flex items-center gap-1 uppercase text-zinc-300 font-semibold tracking-wider mt-2 text-lg"
>
	{#each properties.filter((p) => !!p.label) as property, i}
		{#if i !== 0}
			<DotFilled />
		{/if}
		{#if property.href}
			<p class="flex-shrink-0">
				<a href={property.href} target="_blank">{property.label}</a>
			</p>
		{:else}
			<p class="flex-shrink-0">
				{property.label}
			</p>
		{/if}
	{/each}
</div>

<div class="text-stone-300 font-medium line-clamp-3 opacity-75 max-w-4xl mt-4">
	{overview}
</div>
