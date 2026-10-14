<script lang="ts">
	import type { LogEntryDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Container from '$lib/components/Container.svelte';
	import ListRow from '$lib/components/ListRow.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import { usePaginatedData } from '$lib/stores/data/data.store';
	import { reiverrApi } from '$lib/stores/user.store';
	import classNames from 'classnames';

	const PAGE_SIZE = 50;
	const TYPES: LogEntryDto['type'][] = ['file.deleted', 'download.deleted', 'scan.failed'];

	let error = '';
	let type: LogEntryDto['type'] | undefined = undefined;
	const { observer, loading, reset, ...entries } = usePaginatedData((page) =>
		reiverrApi.serverLog
			.getServerLogEntries({ page, itemsPerPage: PAGE_SIZE, type })
			.then((r) => r.data.items)
			.catch((e) => {
				error = e?.response?.data?.message ?? e?.message ?? String(e);
				return [];
			})
	);

	// Selecting the type that is shown shows all again
	function filter(selected: LogEntryDto['type']) {
		type = type === selected ? undefined : selected;
		error = '';
		reset();
	}
</script>

<Container class="h-full flex flex-col">
	<Container direction="horizontal" class="flex space-x-4">
		{#each TYPES as entryType (entryType)}
			<Pill selected={type === entryType} on:clickOrSelect={() => filter(entryType)}>
				{entryType}
			</Pill>
		{/each}
	</Container>
	{#if $entries.length}
		<Container
			class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide mt-6 pb-16 space-y-4"
			style="backface-visibility: hidden;"
		>
			{#each $entries as entry (entry.id)}
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
				<div use:observer class="absolute bottom-0 w-px h-[50rem] pointer-events-none" />
			</div>
		</Container>
	{:else}
		<div class={classNames('h-ghost mt-14', { error: !!error })}>
			{#if error}
				{error}
			{:else if $loading}
				Loading...
			{:else}
				Nothing has been logged yet.
			{/if}
		</div>
	{/if}
</Container>
