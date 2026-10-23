<script lang="ts">
	import ListRow from '$lib/components/ListRow.svelte';
	import RowCheckbox from '$lib/components/RowCheckbox.svelte';
	import classNames from 'classnames';
	import { ChevronRight } from 'radix-icons-svelte';
	import { createEventDispatcher } from 'svelte';

	export let title = '';
	export let subtitle = '';
	export let subtitleDimmed = false;
	export let status = '';
	export let isError = false;
	export let checked = false;
	export let partiallyChecked = false;

	const dispatch = createEventDispatcher<{ toggle: null; open: null }>();
</script>

<!-- Enter toggles the checkbox; right, or a click outside the checkbox, opens the row -->
<ListRow
	on:mount
	on:enter
	on:select={() => dispatch('toggle')}
	on:click={() => dispatch('open')}
	on:navigate={({ detail }) => {
		if (detail.direction === 'right') {
			detail.preventNavigation();
			detail.stopPropagation();
			dispatch('open');
		}
	}}
	let:hasFocus
>
	<RowCheckbox {checked} {partiallyChecked} {hasFocus} on:toggle />
	<!-- What a click opens, without the checkbox -->
	<div class="group/open flex-1 min-w-0 flex items-center pl-4">
		<div class="flex-1 min-w-0">
			<div class="text-2xl font-semibold line-clamp-1">
				{#if title}
					{title}
				{:else}
					<slot />
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
</ListRow>
