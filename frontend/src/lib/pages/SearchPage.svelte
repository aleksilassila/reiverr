<script lang="ts">
	import Container from '$components/Container.svelte';
	import { scrollIntoView, Selectable } from '$lib/selectable';
	import classNames from 'classnames';
	import { MagnifyingGlass } from 'radix-icons-svelte';
	import { usePageQuery } from '$lib/queries/page-query';
	import { tmdbQueries } from '$lib/queries/tmdb.queries';
	import { onDestroy } from 'svelte';
	import AnimateScale from '../components/AnimateScale.svelte';
	import TmdbCard from '../components/Card/TmdbCard.svelte';
	import CardGrid from '../components/CardGrid.svelte';

	let searchQuery = $state('');
	let typingTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
	let searchInput: HTMLInputElement | undefined = $state(undefined);
	const inputSelectable = new Selectable();
	const inputFocused = inputSelectable.hasFocus;

	/** What is searched: the input once typing pauses */
	let query = $state('');
	const results = usePageQuery(() => tmdbQueries.search(query));

	function handleInput(value: string) {
		clearTimeout(typingTimeout);

		typingTimeout = setTimeout(() => {
			if (value) query = value;
		}, 500);
	}

	onDestroy(() => {
		clearTimeout(typingTimeout);
	});
</script>

<div class="px-32 py-16 h-screen flex flex-col">
	<Container
		direction="horizontal"
		class={classNames('h3 pb-3 divider-lg w-full mb-4', {
			// 'border-secondary-700': !$inputFocused,
			// 'border-secondary-400': $inputFocused
		})}
	>
		<Container
			class={classNames('flex items-center space-x-4 font-medium', {
				// 'text-secondary-300': !$inputFocused
			})}
			selectable={inputSelectable}
			onClickOrSelect={() => searchInput?.focus()}
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
				oninput={() => handleInput(searchQuery)}
				placeholder="Search titles..."
				bind:this={searchInput}
			/>
		</Container>
	</Container>
	<div class="min-h-0 overflow-y-auto scrollbar-hide pt-4">
		{#if !!searchQuery && results.data}
			<CardGrid class="px-4">
				{#each results.data as item}
					<TmdbCard {item} onEnter={scrollIntoView({ vertical: 128 })} />
				{/each}
			</CardGrid>
		{/if}
	</div>
</div>
