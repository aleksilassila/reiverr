<script lang="ts">
	import UiCarousel from '$lib/components/Carousel/UICarousel.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import { settings } from '$lib/stores/settings.store';
	import classNames from 'classnames';
	import { fade } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import { CaretDown, Gear } from 'radix-icons-svelte';
	import CardPlaceholder from '$lib/components/Card/CardPlaceholder.svelte';
	import type { ComponentProps } from 'svelte';
	import Poster from '$lib/components/Poster/Poster.svelte';
	import { getJellyfinPosterUrl, type JellyfinItem } from '$lib/apis/jellyfin/jellyfinApi';
	import { getRadarrPosterUrl, type RadarrMovie } from '$lib/apis/radarr/radarrApi';
	import { getSonarrPosterUrl, type SonarrSeries } from '$lib/apis/sonarr/sonarrApi';
	import { jellyfinItemsStore, radarrMoviesStore, sonarrSeriesStore } from '$lib/stores/data.store';
	import Button from '$lib/components/Button.svelte';

	const PAGE_SIZE = 100;

	let itemsVisible: 'all' | 'movies' | 'shows' = 'all';
	let sortBy: 'added' | 'rating' | 'release' | 'size' | 'name' = 'name';
	let searchQuery = '';

	let openTab: 'available' | 'watched' | 'unavailable' = 'available';
	let page = 0;
	let loading = true;

	let searchInput: HTMLInputElement | undefined;

	let posterPropsPromise: Promise<ComponentProps<Poster>[]> = Promise.resolve([]);
	$: posterPropsPromise = getComponentProps(openTab, page, sortBy, searchQuery);

	function getPropsFromJellyfinItem(
		item: JellyfinItem,
		sort: typeof sortBy,
		searchQuery: string
	): ComponentProps<Poster> {
		return {
			tmdbId: Number(item.ProviderIds?.Tmdb) || 0,
			jellyfinId: item.Id,
			title: item.Name || undefined,
			subtitle: item.Genres?.join(', ') || undefined,
			backdropUrl: getJellyfinPosterUrl(item, 80),
			size: 'dynamic',
			...(item.Type === 'Movie' ? { type: 'movie' } : { type: 'series' })
		};
	}

	function getPropsfromServarrItem(
		item: RadarrMovie & SonarrSeries,
		sort: typeof sortBy,
		searchQuery: string
	): ComponentProps<Poster> {
		console.log(item);
		if (item.tmdbId) {
			const movie = item as RadarrMovie;

			return {
				tmdbId: movie.tmdbId || 0,
				title: movie.title || undefined,
				subtitle: movie.genres?.join(', ') || undefined,
				backdropUrl: getRadarrPosterUrl(movie),
				size: 'dynamic',
				type: 'movie'
			};
		} else {
			const series = item as SonarrSeries;

			return {
				tvdbId: series.tvdbId || 0,
				title: item.title || undefined,
				subtitle: item.genres?.join(', ') || undefined,
				backdropUrl: getSonarrPosterUrl(series),
				size: 'dynamic',
				type: 'series',
				tmdbId: undefined
			};
		}
	}

	async function getComponentProps(
		tab: typeof openTab,
		page: number,
		sort: typeof sortBy,
		searchQuery: string
	): Promise<ComponentProps<Poster>[]> {
		const jellyfinItemsPromise = jellyfinItemsStore.promise.then((i) => i || []);

		if (tab === 'available') {
			return jellyfinItemsPromise.then((items) =>
				items
					.filter((i) => !i.UserData?.Played)
					.map((item) => getPropsFromJellyfinItem(item, sort, searchQuery))
			);
		} else if (tab === 'watched') {
			return jellyfinItemsPromise.then((items) =>
				items
					.filter((i) => i.UserData?.Played)
					.map((item) => getPropsFromJellyfinItem(item, sort, searchQuery))
			);
		} else if (tab === 'unavailable') {
			return Promise.all([
				radarrMoviesStore.promise,
				sonarrSeriesStore.promise,
				jellyfinItemsPromise
			])
				.then(([radarr, sonarr, jellyfinItems]) => ({
					items: [...radarr, ...sonarr],
					jellyfinItems
				}))
				.then(({ items, jellyfinItems }) =>
					items
						.filter(
							(i) =>
								!jellyfinItems.find((j) => j.ProviderIds?.Tmdb === String((<any>i).tmdbId || '-'))
						)
						.filter(
							(i) =>
								!jellyfinItems.find((j) => j.ProviderIds?.Tvdb === String((<any>i).tvdbId || '-'))
						)
						.map((i) => getPropsfromServarrItem(i, sort, searchQuery))
				);
		}

		return [];
	}

	function handleShortcuts(event: KeyboardEvent) {
		if (event.key === 'f' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			searchInput?.focus();
		}
	}
</script>

<svelte:window on:keydown={handleShortcuts} />

<div class="flex items-center justify-between gap-2">
	<UiCarousel>
		<div class="flex gap-6 text-lg font-medium text-zinc-400">
			<button
				class={classNames('hover:text-zinc-300 selectable rounded px-1 -mx-1', {
					'text-zinc-200': openTab === 'available'
				})}
				on:click={() => {
					openTab = 'available';
					page = 0;
				}}
			>
				{$_('library.available')}
			</button>
			<button
				class={classNames('hover:text-zinc-300 selectable rounded px-1 -mx-1', {
					'text-zinc-200': openTab === 'watched'
				})}
				on:click={() => {
					openTab = 'watched';
					page = 0;
				}}
			>
				{$_('library.watched')}
			</button>
			<button
				class={classNames('hover:text-zinc-300 selectable rounded px-1 -mx-1', {
					'text-zinc-200': openTab === 'unavailable'
				})}
				on:click={() => {
					openTab = 'unavailable';
					page = 0;
				}}
			>
				{$_('library.unavailable')}
			</button>
		</div>
	</UiCarousel>
	<div class="flex items-center gap-3 justify-end flex-shrink-0 flex-initial relative">
		<IconButton>
			<div class="flex gap-0.5 items-center text-sm">
				<span>
					{$_('library.sort.byTitle')}
				</span>
				<CaretDown size={20} />
			</div>
		</IconButton>
		<IconButton>
			<Gear size={20} />
		</IconButton>
	</div>
</div>

<div
	class="grid gap-x-2 sm:gap-x-4 gap-y-4 sm:gap-y-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
>
	{#await posterPropsPromise}
		{#each [...Array(20).keys()] as index (index)}
			<CardPlaceholder size="dynamic" {index} />
		{/each}
	{:then props}
		{#each props as prop}
			<Poster {...prop} />
		{:else}
			<div class="flex-1 flex items-center text-zinc-500">No items.</div>
		{/each}
	{:catch error}
		<p>{error.message}</p>
	{/await}
</div>

{#await posterPropsPromise then props}
	<div class="mx-auto my-4">
		<Button
			on:click={() => (page = page + 1)}
			disabled={PAGE_SIZE + page * PAGE_SIZE >= props?.length}>Load More</Button
		>
	</div>
{/await}
