<script lang="ts">
	import classNames from 'classnames';
	import type { MediaStatusTags } from './status-tags';
	import Tag from './Tag.svelte';

	interface Props {
		tags: MediaStatusTags;
		size?: 'sm' | 'md';
		/** The side the tags are aligned to: the primary tag is at that edge */
		direction?: 'left' | 'right';
		class?: string;
	}

	let { tags, size = 'md', direction = 'left', class: className }: Props = $props();
</script>

<!-- The secondary tag is collapsed to its icon next to a primary one -->
{#if tags.primary || tags.secondary}
	<div
		class={classNames(
			'flex items-center space-x-2',
			{ 'flex-row-reverse space-x-reverse': direction === 'right' },
			className
		)}
	>
		{#if tags.primary}
			<Tag
				{size}
				type={tags.primary.type}
				icon={tags.primary.icon}
				label={tags.primary.label}
				title={tags.primary.detail}
			/>
		{/if}
		{#if tags.secondary}
			<Tag
				{size}
				type={tags.secondary.type}
				icon={tags.secondary.icon}
				label={tags.primary ? tags.secondary.shortLabel : tags.secondary.label}
				title={tags.secondary.label}
			/>
		{/if}
	</div>
{/if}
