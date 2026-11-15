<script lang="ts">
	import type { ComponentProps, Snippet } from 'svelte';
	import ListRow from '$lib/components/ListRow.svelte';
	import RowCheckbox from '$lib/components/RowCheckbox.svelte';
	import type { MediaStatusTags } from '$lib/components/status-tags';
	import StatusTags from '$lib/components/StatusTags.svelte';
	import classNames from 'classnames';
	import { Check, ChevronRight } from 'radix-icons-svelte';

	interface Props {
		onMounted?: ComponentProps<typeof ListRow>['onMounted'];
		onEnter?: ComponentProps<typeof ListRow>['onEnter'];
		onToggle?: () => void;
		onOpen?: () => void;
		title?: string;
		subtitle?: string;
		subtitleDimmed?: boolean;
		status?: string;
		isError?: boolean;
		/** Of an episode or a movie, which has no status line */
		statusTags?: MediaStatusTags;
		/** The user has watched the episode or the movie of the row */
		watched?: boolean;
		checked?: boolean;
		partiallyChecked?: boolean;
		children?: Snippet;
	}

	let {
		title = '',
		subtitle = '',
		subtitleDimmed = false,
		status = '',
		isError = false,
		statusTags = {},
		watched = false,
		checked = false,
		partiallyChecked = false,
		children: content,
		onToggle,
		onOpen,
		onMounted,
		onEnter
	}: Props = $props();
</script>

<!-- Enter toggles the checkbox; right, or a click outside the checkbox, opens the row -->
<ListRow
	{onMounted}
	{onEnter}
	onSelect={() => onToggle?.()}
	onclick={() => onOpen?.()}
	onNavigate={(e) => {
		if (e.direction === 'right') {
			e.preventNavigation();
			e.stopPropagation();
			onOpen?.();
		}
	}}
>
	{#snippet children({ hasFocus })}
		<RowCheckbox {checked} {partiallyChecked} {hasFocus} {onToggle} />
		<!-- What a click opens, without the checkbox -->
		<div class="group/open flex-1 min-w-0 flex items-center pl-4">
			<div class="flex-1 min-w-0">
				<div class="flex items-center">
					<div class="min-w-0 text-2xl font-semibold line-clamp-1">
						{#if title}
							{title}
						{:else}
							{@render content?.()}
						{/if}
					</div>
					<!-- The mark of a watched episode on its card -->
					{#if watched}
						<div class="flex-shrink-0 ml-3 rounded-full p-0.5 bg-primary-500" title="Watched">
							<Check class="text-secondary-800" size={18} />
						</div>
					{/if}
				</div>
				{#if subtitle}
					<div
						class={classNames('text-lg font-medium line-clamp-1 mt-1', {
							'text-secondary-400': subtitleDimmed,
							'text-secondary-200': !subtitleDimmed
						})}
					>
						{subtitle}
					</div>
				{/if}
			</div>
			<StatusTags tags={statusTags} direction="right" class="flex-shrink-0 ml-4" />
			{#if status}
				<div
					class={classNames(
						'flex-shrink-0 ml-4 max-w-md line-clamp-1 text-lg font-medium',
						isError ? 'text-red-400' : 'text-secondary-300'
					)}
				>
					{status}
				</div>
			{/if}
			<ChevronRight
				size={24}
				class={classNames(
					'flex-shrink-0 ml-2 group-hover:opacity-100 group-hover/open:text-primary-500',
					{ 'opacity-0': !hasFocus, 'text-primary-500': hasFocus }
				)}
			/>
		</div>
	{/snippet}
</ListRow>
