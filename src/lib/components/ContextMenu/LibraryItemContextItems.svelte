<script lang="ts">
	import { setJellyfinItemUnwatched, setJellyfinItemWatched } from '$lib/apis/jellyfin/jellyfinApi';
	import { library, type LibraryItemStore } from '$lib/stores/library.store';
	import { settings } from '$lib/stores/settings.store';
	import type { TitleType } from '$lib/types';
	import ContextMenuDivider from './ContextMenuDivider.svelte';
	import ContextMenuItem from './ContextMenuItem.svelte';

	export let itemStore: LibraryItemStore;
	export let type: TitleType;
	export let tmdbId: number;

	let watched = false;
	itemStore.subscribe((i) => {
		if (i.item?.jellyfinItem) {
			watched =
				i.item.jellyfinItem.UserData?.Played !== undefined
					? i.item.jellyfinItem.UserData?.Played
					: watched;
		}
	});

	function handleSetWatched() {
		if ($itemStore.item?.jellyfinId) {
			watched = true;
			setJellyfinItemWatched($itemStore.item?.jellyfinId).finally(() => library.refreshIn(3000));
		}
	}

	function handleSetUnwatched() {
		if ($itemStore.item?.jellyfinId) {
			watched = false;
			setJellyfinItemUnwatched($itemStore.item?.jellyfinId).finally(() => library.refreshIn(3000));
		}
	}

	function handleOpenInJellyfin() {
		window.open(
			$settings.jellyfin.baseUrl +
				'/web/index.html#!/details?id=' +
				$itemStore.item?.jellyfinItem?.Id
		);
	}
</script>

{#if $itemStore.item}
	<ContextMenuItem on:click={handleSetWatched} disabled={!$itemStore.item?.jellyfinId || watched}>
		Mark as watched
	</ContextMenuItem>
	<ContextMenuItem
		on:click={handleSetUnwatched}
		disabled={!$itemStore.item?.jellyfinId || !watched}
	>
		Mark as unwatched
	</ContextMenuItem>
	<ContextMenuDivider />
	<ContextMenuItem disabled={!$itemStore.item.jellyfinItem} on:click={handleOpenInJellyfin}>
		Open in Jellyfin
	</ContextMenuItem>
	{#if $itemStore.item.type === 'movie'}
		<ContextMenuItem
			disabled={!$itemStore.item.radarrMovie}
			on:click={() =>
				window.open($settings.radarr.baseUrl + '/movie/' + $itemStore.item?.radarrMovie?.tmdbId)}
		>
			Open in Radarr
		</ContextMenuItem>
	{:else}
		<ContextMenuItem
			disabled={!$itemStore.item.sonarrSeries}
			on:click={() =>
				window.open(
					$settings.sonarr.baseUrl + '/series/' + $itemStore.item?.sonarrSeries?.titleSlug
				)}
		>
			Open in Sonarr
		</ContextMenuItem>
	{/if}
{/if}
<ContextMenuItem on:click={() => window.open(`https://www.themoviedb.org/${type}/${tmdbId}`)}>
	Open in TMDB
</ContextMenuItem>
