<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import { scrollElementIntoView } from '$lib/scroll-into-view';
	import type { Request } from '$lib/stores/data/series-data.store';
	import { capitalize } from '$lib/utils';
	import classNames from 'classnames';
	import { Check } from 'radix-icons-svelte';
	import type { Writable } from 'svelte/store';

	export let seasonNumber: number;
	export let episodeNumber: number;
	export let episodeName: string;
	export let requests: Request[] | undefined = undefined;
	export let selecting: boolean = false;
	export let episodeSelections: Writable<Set<string>> | undefined = undefined;

	$: key = `${seasonNumber}-${episodeNumber}`;
	$: checked = $episodeSelections?.has(key) ?? false;

	function toggleSelection() {
		if (!episodeSelections) return;
		episodeSelections.update((set) => {
			const next = new Set(set);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	}
</script>

<Container
	on:enter={({ detail }) => {
		const el =
			detail.selectable.getSibling(-1)?.getHtmlElement() ?? detail.selectable?.getHtmlElement();

		if (el) scrollElementIntoView(el, { top: 32 });
	}}
	on:clickOrSelect={() => {
		if (selecting) toggleSelection();
	}}
	let:hasFocus
>
	<div class={classNames('cursor-pointer my-8 rounded-xl flex items-center gap-3', {})}>
		{#if selecting}
			<div
				class={classNames(
					'shrink-0 border-2 rounded-lg w-7 h-7 flex items-center justify-center transition-colors',
					{
						'border-primary-500 bg-primary-500 text-secondary-800': checked,
						'border-secondary-500': !checked
					}
				)}
			>
				{#if checked}
					<Check size={18} />
				{/if}
			</div>
		{/if}
		<span
			class={classNames('text-3xl font-semibold flex items-center', {
				'text-secondary-500': !hasFocus,
				'text-primary-500': hasFocus
			})}
		>
			<span class="line-clamp-1">
				<div>
					S{seasonNumber}E{episodeNumber} - {episodeName}
					{#each requests ?? [] as request}
						{capitalize(request.profile.label)}
					{/each}
				</div>
			</span>
		</span>
	</div>
</Container>
