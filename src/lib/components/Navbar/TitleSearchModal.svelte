<script lang="ts">
	import Modal from '../Modal/Modal.svelte';
	import ModalContent from '../Modal/ModalContent.svelte';
	import { Cross1, Cross2, MagnifyingGlass } from 'radix-icons-svelte';
	import IconButton from '../IconButton.svelte';
	import { TmdbApi } from '$lib/apis/tmdb/tmdbApi';
	import type { MultiSearchResponse } from '$lib/apis/tmdb/tmdbApi';
	import { TMDB_IMAGES } from '$lib/constants';
	import ModalHeader from '../Modal/ModalHeader.svelte';
	import { onMount } from 'svelte';

	export let visible = false;
	let searchInput: HTMLInputElement;
	let searchValue = '';

	let timeout: NodeJS.Timeout;
	let fetching = false;
	let results: MultiSearchResponse['results'] | null = null;

	export let close = () => {
		visible = false;
		searchValue = '';
		fetching = false;
		results = null;
		clearTimeout(timeout);
	};

	const searchTimeout = () => {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			searchMovie(searchValue);
		}, 700);
	};

	const searchMovie = (query: string) => {
		fetching = true;
		TmdbApi.get<MultiSearchResponse>('/search/movie', {
			params: {
				query
			}
		})
			.then((res) => {
				if (res.data) results = res.data.results;
			})
			.finally(() => (fetching = false));
	};

	$: if (visible && searchInput) searchInput.focus();
</script>

<Modal {visible} {close}>
	<ModalContent>
		<ModalHeader {close}>
			<MagnifyingGlass size={20} class="text-zinc-400" />
			<input
				bind:value={searchValue}
				bind:this={searchInput}
				on:input={searchTimeout}
				type="text"
				class="flex-1 bg-transparent font-light outline-none"
				placeholder="Search for Movies and Shows..."
			/>
		</ModalHeader>
		{#if !results || searchValue === ''}
			<div class="text-sm text-zinc-200 opacity-50 font-light p-4">No recent searches</div>
		{:else if results?.length === 0 && !fetching}
			<div class="text-sm text-zinc-200 opacity-50 font-light p-4">No search results</div>
		{:else}
			<div class="py-2">
				{#each results.filter((m) => m).slice(0, 5) as result}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div
						class="flex px-4 py-2 gap-4 hover:bg-lighten cursor-pointer"
						on:click={() => (window.location.href = '/movie/' + result.id)}
					>
						<div
							style={"background-image: url('" + TMDB_IMAGES + result.poster_path + "');"}
							class="bg-center bg-cover w-16 h-24 rounded-sm"
						/>
						<div class="flex-1 flex flex-col gap-1">
							<div class="flex gap-2">
								<div class="font-normal tracking-wide">{result.original_title}</div>
								<div class="text-zinc-400">
									{new Date(result.release_date).getFullYear()}
								</div>
							</div>
							<div class="text-sm text-zinc-300 line-clamp-3">{result.overview}</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</ModalContent>
</Modal>
