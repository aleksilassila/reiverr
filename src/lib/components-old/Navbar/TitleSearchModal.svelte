<script lang="ts">
	import type { TmdbMovie2, TmdbSeries2 } from '$lib/apis/tmdb/tmdbApi';
	import { searchTmdbTitles } from '$lib/apis/tmdb/tmdbApi';
	import { TMDB_POSTER_SMALL } from '$lib/constants';
	import { MagnifyingGlass } from 'radix-icons-svelte';
	import { modalStack } from '../../stores/modal.store';
	import ModalContent from '../Modal/ModalContainer.svelte';
	import ModalHeader from '../Modal/ModalHeader.svelte';
	import { onMount } from 'svelte';
	import type { TitleType } from '$lib/types';
	import { _ } from 'svelte-i18n';

	export let modalId: symbol;

	let inputValue = '';
	let inputElement: HTMLInputElement;

	let fetching = false;
	let resultProps:
		| {
				tmdbId: number;
				type: TitleType;
				overview: string;
				posterUri: string;
				title: string;
				year: number;
				seasons?: number;
		  }[]
		| undefined = undefined;

	let searchTimeout: NodeJS.Timeout;

	const handleInput = () => {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			searchMovie(inputValue);
		}, 700);
	};

	const searchMovie = (query: string) => {
		fetching = true;
		searchTmdbTitles(query)
			.then((items) => {
				resultProps = items
					.filter((i) => i.media_type !== 'person')
					.filter((i: TmdbMovie2 & TmdbSeries2) => i.release_date || i.first_air_date)
					.map((i: TmdbMovie2 & TmdbSeries2) => ({
						// ^ Types not accurate! ^
						tmdbId: i.id || 0,
						type: (i as any).media_type === 'movie' ? 'movie' : 'series',
						posterUri: i.poster_path || '',
						title: i.title || i.name || '',
						year: new Date(i.release_date || i.first_air_date || Date.now()).getFullYear(),
						seasons: undefined,
						overview: i.overview || ''
					}));
			})
			.finally(() => (fetching = false));
	};

	function handleClose() {
		modalStack.close(modalId);
	}

	$: if (inputElement) inputElement.focus();

	onMount(() => () => clearTimeout(searchTimeout));
</script>

<ModalContent>
	<ModalHeader close={handleClose}>
		<MagnifyingGlass size={20} class="text-zinc-400" />
		<input
			bind:value={inputValue}
			bind:this={inputElement}
			on:input={handleInput}
			type="text"
			class="flex-1 bg-transparent font-light outline-none"
			placeholder={$_('search.placeHolder')}
		/>
	</ModalHeader>
	{#if resultProps === undefined || inputValue === ''}
		<div class="text-sm text-zinc-200 opacity-50 font-light p-4">
			{$_('search.noRecentSearches')}
		</div>
	{:else if resultProps?.length === 0 && !fetching}
		<div class="text-sm text-zinc-200 opacity-50 font-light p-4">{$_('search.noResults')}</div>
	{:else}
		<div class="py-2">
			{#each resultProps.slice(0, 5) as result}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<a
					class="flex px-4 py-2 gap-4 hover:bg-lighten focus-visible:bg-lighten cursor-pointer outline-none"
					href={`/${result.type}/${result.tmdbId}`}
					on:click={handleClose}
				>
					<div
						style={"background-image: url('" + TMDB_POSTER_SMALL + result.posterUri + "');"}
						class="bg-center bg-cover w-16 h-24 rounded-sm"
					/>
					<div class="flex-1 flex flex-col gap-1">
						<div class="flex gap-2">
							<div class="font-normal tracking-wide">{result.title}</div>
							<div class="text-zinc-400">
								{result.year}
							</div>
							{#if result.seasons}
								<div class="text-zinc-400">{result.seasons}</div>
							{/if}
						</div>
						<div class="text-sm text-zinc-300 line-clamp-3">{result.overview}</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</ModalContent>
