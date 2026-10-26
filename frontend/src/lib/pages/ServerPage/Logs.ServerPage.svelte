<script lang="ts">
	import type { LogEntryDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Container from '$lib/components/Container.svelte';
	import ListRow from '$lib/components/ListRow.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import { usePageInfiniteQuery } from '$lib/queries/page-query';
	import { serverLogQueries } from '$lib/queries/server-log.queries';
	import { scrollIntoView } from '$lib/selectable';
	import classNames from 'classnames';
	import { derived, writable } from 'svelte/store';

	const TYPES: LogEntryDto['type'][] = ['file.deleted', 'download.deleted', 'scan.failed'];

	const type = writable<LogEntryDto['type'] | undefined>(undefined);
	const entries = usePageInfiniteQuery(derived(type, ($type) => serverLogQueries.entries($type)));
	const { loadMore } = entries;
	$: entryList = $entries.data ?? [];

	const errorMessage = (e: any): string => e?.response?.data?.message ?? e?.message ?? String(e);

	// Selecting the type that is shown shows all again
	function filter(selected: LogEntryDto['type']) {
		$type = $type === selected ? undefined : selected;
	}
</script>

<Container class="h-full flex flex-col">
	<Container direction="horizontal" class="flex space-x-4">
		{#each TYPES as entryType (entryType)}
			<Pill selected={$type === entryType} on:clickOrSelect={() => filter(entryType)}>
				{entryType}
			</Pill>
		{/each}
	</Container>
	{#if entryList.length}
		<Container
			class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide mt-6 pb-16 space-y-4"
			style="backface-visibility: hidden;"
		>
			{#each entryList as entry (entry.id)}
				<ListRow on:enter={scrollIntoView({ vertical: 96 })}>
					<div class="flex-1 min-w-0">
						<div class="text-2xl font-semibold line-clamp-1">{entry.message}</div>
						<div class="text-lg font-medium text-secondary-400 mt-1">
							{new Date(entry.createdAt).toLocaleString()} · {entry.type}
						</div>
					</div>
				</ListRow>
			{/each}
			<!-- Reaches up from the end of the rows, so that more are there before the last one is -->
			<div class="relative">
				<div use:loadMore class="absolute bottom-0 w-px h-[50rem] pointer-events-none" />
			</div>
		</Container>
	{:else}
		<div class={classNames('h-ghost mt-14', { error: !!$entries.error })}>
			{#if $entries.error}
				{errorMessage($entries.error)}
			{:else if $entries.isLoading}
				Loading...
			{:else}
				Nothing has been logged yet.
			{/if}
		</div>
	{/if}
</Container>
