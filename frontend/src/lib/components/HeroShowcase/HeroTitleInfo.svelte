<script lang="ts">
	import classNames from 'classnames';
	import { DotFilled } from 'radix-icons-svelte';
	import type { TitleInfoProperty } from './HeroTitleInfo';
	import TitleText from '$lib/components/TitleText.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/** The title text, or a snippet in its place */
		title?: string | Snippet;
		properties?: TitleInfoProperty[];
		overview: string;
		onClickTitle?: (() => void) | undefined;
	}

	let { title = '', properties = [], overview, onClickTitle = undefined }: Props = $props();
</script>

<TitleText
	title={typeof title === 'string' ? title : ''}
	onclick={onClickTitle}
	class={classNames({ 'hover:text-amber-200 cursor-pointer': !!onClickTitle })}
>
	{#if typeof title === 'function'}{@render title()}{/if}
</TitleText>

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
						<property.icon size={22} />
					{/if}
				</a>
			</p>
		{:else if property.label}
			<p class="flex-shrink-0">
				{property.label}
			</p>
		{:else if property.icon}
			<span>
				<property.icon size={22} />
			</span>
		{/if}
	{/each}
</div>

{#if overview}
	<div class="body line-clamp-4 opacity-75 max-w-4xl mt-4">
		{overview}
	</div>
{/if}
