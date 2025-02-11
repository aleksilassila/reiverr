<script lang="ts">
	import Container from '$components/Container.svelte';
	import { MagnifyingGlass } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import { tmdbApi } from '../apis/tmdb/tmdb-api';
	import CardGrid from '../components/CardGrid.svelte';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import { type ComponentProps, onDestroy } from 'svelte';
	import { scrollIntoView } from '../selectable';
	import AnimateScale from '../components/AnimateScale.svelte';
	import type { Readable } from 'svelte/store';
	import DetachedPage from '../components/DetachedPage/DetachedPage.svelte';

	let searchQuery = '';
	let typingTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
	let loadingTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
	let results: Promise<ComponentProps<TmdbCard>[]> = Promise.resolve([]);
	let searchInput: HTMLInputElement | undefined = undefined;
	let inputFocused: Readable<boolean>;

	function handleInput(query: string) {
		clearTimeout(typingTimeout);

		typingTimeout = setTimeout(async () => {
			if (!query) return;
			results = tmdbApi.searchTitles(query).then((results) =>
				results.map((result) => ({
					item: result
				}))
			);
			if (query !== searchQuery) return;
		}, 500);
	}

	onDestroy(() => {
		clearTimeout(typingTimeout);
	});
</script>

<DetachedPage class="px-32 py-16 h-screen flex flex-col">
	<Container
		direction="horizontal"
		class={classNames('h3 pb-3 border-b-2 w-full mb-4', {
			'border-secondary-700': true
			// 'border-secondary-700': !$inputFocused,
			// 'border-secondary-400': $inputFocused
		})}
	>
		<Container
			class={classNames('flex items-center space-x-4 font-medium', {
				// 'text-secondary-300': !$inputFocused
			})}
			bind:hasFocus={inputFocused}
			on:clickOrSelect={() => searchInput?.focus()}
		>
			<AnimateScale hasFocus={$inputFocused}>
				<MagnifyingGlass
					size={32}
					class={classNames({
						'text-secondary-200': !$inputFocused
					})}
				/>
			</AnimateScale>
			<input
				class="bg-transparent outline-none placeholder:text-secondary-400"
				bind:value={searchQuery}
				on:input={() => handleInput(searchQuery)}
				placeholder="Search titles..."
				bind:this={searchInput}
			/>
		</Container>
	</Container>
	<div class="min-h-0 overflow-y-auto scrollbar-hide pt-4">
		{#if !!searchQuery}
			{#await results then results}
				<CardGrid class="px-4">
					{#each results as result}
						<TmdbCard {...result} on:enter={scrollIntoView({ vertical: 128 })} />
					{/each}
				</CardGrid>
			{/await}
		{/if}
	</div>
</DetachedPage>
