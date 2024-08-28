<script lang="ts">
	import {
		setJellyfinItemUnwatched,
		setJellyfinItemWatched,
		type JellyfinItem
	} from '$lib/apis/jellyfin/jellyfinApi';
	import type { RadarrMovie } from '../../apis/radarr/radarr-api';
	import type { SonarrSeries } from '../../apis/sonarr/sonarr-api';
	import { jellyfinItemsStore } from '../../stores/data.store';
	import { settings } from '../../stores/settings.store';
	import type { TitleType } from '../../types';
	import ContextMenuDivider from './ContextMenuDivider.svelte';
	import ContextMenuItem from './ContextMenuItem.svelte';
	import { _ } from 'svelte-i18n';

	export let jellyfinItem: JellyfinItem | undefined = undefined;
	export let sonarrSeries: SonarrSeries | undefined = undefined;
	export let radarrMovie: RadarrMovie | undefined = undefined;

	export let type: TitleType;
	export let tmdbId: number;

	let watched = false;
	$: watched = jellyfinItem?.UserData?.Played !== undefined ? jellyfinItem.UserData?.Played : false;

	function handleSetWatched() {
		if (jellyfinItem?.Id) {
			watched = true;
			setJellyfinItemWatched(jellyfinItem.Id).finally(() => jellyfinItemsStore.refreshIn(3000));
		}
	}

	function handleSetUnwatched() {
		if (jellyfinItem?.Id) {
			watched = false;
			setJellyfinItemUnwatched(jellyfinItem.Id).finally(() => jellyfinItemsStore.refreshIn(3000));
		}
	}

	function handleOpenInJellyfin() {
		window.open($settings.jellyfin.baseUrl + '/web/index.html#!/details?id=' + jellyfinItem?.Id);
	}
</script>

<ContextMenuItem on:click={handleSetWatched} disabled={!jellyfinItem?.Id || watched}>
	{_('contextMenu.markAsWatched')}
</ContextMenuItem>
<ContextMenuItem on:click={handleSetUnwatched} disabled={!jellyfinItem?.Id || !watched}>
	{_('contextMenu.markAsUnwatched')}
</ContextMenuItem>
<ContextMenuDivider />
<ContextMenuItem disabled={!jellyfinItem?.Id} on:click={handleOpenInJellyfin}>
	{_('contextMenu.openInJellyfin')}
</ContextMenuItem>
{#if type === 'movie'}
	<ContextMenuItem
		disabled={!radarrMovie}
		on:click={() => window.open($settings.radarr.baseUrl + '/movie/' + radarrMovie?.tmdbId)}
	>
	{_('contextMenu.openInRadarr')}
	</ContextMenuItem>
{:else}
	<ContextMenuItem
		disabled={!sonarrSeries}
		on:click={() => window.open($settings.sonarr.baseUrl + '/series/' + sonarrSeries?.titleSlug)}
	>
	{_('contextMenu.openInSonarr')}
	</ContextMenuItem>
{/if}
<ContextMenuItem on:click={() => window.open(`https://www.themoviedb.org/${type}/${tmdbId}`)}>
	{_('contextMenu.openInTMDB')}
</ContextMenuItem>
