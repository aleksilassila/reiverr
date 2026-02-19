<script lang="ts">
	import type { TmdbSeason } from '$lib/apis/tmdb/tmdb-api';
	import Container from '$lib/components/Container.svelte';
	import type { Request } from '$lib/stores/data/series-data.store';
	import classNames from 'classnames';
	import { Check, Minus } from 'radix-icons-svelte';
	import type { Writable } from 'svelte/store';
	import EpisodeItem from './EpisodeItem.svelte';

	export let season: TmdbSeason;
	export let episodeRequests: Map<string, Request[]> | undefined = undefined;
	export let selecting: boolean = false;
	export let episodeSelections: Writable<Set<string>> | undefined = undefined;

	let collapsed = false;

	$: episodeKeys = (season.episodes ?? []).map(
		(ep) => `${season.season_number}-${ep.episode_number}`
	);
	$: selectedCount = episodeKeys.filter((k) => $episodeSelections?.has(k)).length;
	$: allSelected = episodeKeys.length > 0 && selectedCount === episodeKeys.length;
	$: someSelected = selectedCount > 0 && !allSelected;

	// Force uncollapse when entering selection mode
	// $: if (selecting) collapsed = false;

	function toggleCollapsed() {
		if (!selecting) collapsed = !collapsed;
	}

	function toggleSeasonSelection() {
		if (!episodeSelections) return;
		episodeSelections.update((set) => {
			const next = new Set(set);
			if (allSelected) {
				// Deselect all episodes in this season
				episodeKeys.forEach((k) => next.delete(k));
			} else {
				// Select all episodes in this season
				episodeKeys.forEach((k) => next.add(k));
			}
			return next;
		});
	}
</script>

<div class="mt-8">
	<Container
		let:hasFocus
		on:clickOrSelect={() => {
			if (selecting) {
				toggleSeasonSelection();
			} else {
				toggleCollapsed();
			}
		}}
	>
		<div
			class={classNames('flex items-center gap-3 py-3 cursor-pointer select-none rounded-xl px-2', {
				'text-secondary-400': !hasFocus,
				'text-primary-400': hasFocus
			})}
		>
			{#if selecting}
				<div
					class={classNames(
						'shrink-0 border-2 rounded-lg w-7 h-7 flex items-center justify-center transition-colors',
						{
							'border-primary-500 bg-primary-500 text-secondary-800': allSelected,
							'border-primary-500 bg-primary-500/30 text-primary-300': someSelected,
							'border-secondary-500': !allSelected && !someSelected
						}
					)}
				>
					{#if allSelected}
						<Check size={18} />
					{:else if someSelected}
						<Minus size={18} />
					{/if}
				</div>
			{:else}
				<span
					class={classNames('text-2xl font-bold transition-transform duration-200', {
						'rotate-0': !collapsed,
						'-rotate-90': collapsed
					})}
				>
					▾
				</span>
			{/if}
			<span class="text-2xl font-bold">
				{season.name ?? `Season ${season.season_number}`}
			</span>
			<span class="text-lg text-secondary-500 ml-1">
				({season.episodes?.length ?? 0} episodes)
			</span>
		</div>
	</Container>

	{#if !collapsed || selecting}
		{#each season.episodes ?? [] as episode}
			{@const requests = episodeRequests?.get(`${season.season_number}-${episode.episode_number}`)}
			<EpisodeItem
				seasonNumber={season.season_number ?? 0}
				episodeNumber={episode.episode_number ?? 0}
				episodeName={episode.name ?? ''}
				{requests}
				{selecting}
				{episodeSelections}
			/>
		{/each}
	{/if}
</div>
