<script lang="ts">
	import classNames from 'classnames';
	import { DotFilled } from 'radix-icons-svelte';
	import type { TitleInfoProperty } from './HeroTitleInfo';
	import TitleText from '$lib/components/TitleText.svelte';

	export let title: string;
	export let properties: TitleInfoProperty[] = [];
	export let overview: string;
	export let onClickTitle: (() => void) | undefined = undefined;
</script>

<TitleText
	{title}
	on:click={onClickTitle}
	class={classNames({ 'hover:text-amber-200 cursor-pointer': !!onClickTitle })}
/>

<div
	class="flex items-center gap-1 uppercase text-secondary-200 font-semibold tracking-wider mt-2 text-lg"
>
	{#each properties.filter((p) => !!p.label || !!p.icon) as property, i}
		{#if i !== 0}
			<DotFilled />
		{/if}
		{#if property.href}
			<p class="flex-shrink-0">
				<a href={property.href} target="_blank">
					{#if property.label}
						{property.label}
					{:else if property.icon}
						<svelte:component this={property.icon} size={22} />
					{/if}
				</a>
			</p>
		{:else if property.label}
			<p class="flex-shrink-0">
				{property.label}
			</p>
		{:else if property.icon}
			<span>
				<svelte:component this={property.icon} size={22} />
			</span>
		{/if}
	{/each}
</div>

{#if overview}
	<div class="body line-clamp-4 opacity-75 max-w-4xl mt-4">
		{overview}
	</div>
{/if}
