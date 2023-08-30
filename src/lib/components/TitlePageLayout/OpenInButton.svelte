<script lang="ts">
	import type { JellyfinItem } from '$lib/apis/jellyfin/jellyfinApi';
	import type { RadarrMovie } from '$lib/apis/radarr/radarrApi';
	import type { SonarrSeries } from '$lib/apis/sonarr/sonarrApi';
	import type { TitleType } from '$lib/types';
	import { DotsVertical } from 'radix-icons-svelte';
	import Button from '../Button.svelte';
	import ContextMenuButton from '../ContextMenu/ContextMenuButton.svelte';
	import LibraryItemContextItems from '../ContextMenu/LibraryItemContextItems.svelte';

	export let title = '';

	export let jellyfinItem: JellyfinItem | undefined = undefined;
	export let sonarrSeries: SonarrSeries | undefined = undefined;
	export let radarrMovie: RadarrMovie | undefined = undefined;

	export let type: TitleType;
	export let tmdbId: number;
</script>

<ContextMenuButton heading={title}>
	<svelte:fragment slot="menu">
		<LibraryItemContextItems {jellyfinItem} {sonarrSeries} {radarrMovie} {type} {tmdbId} />
	</svelte:fragment>
	<Button slim>
		<DotsVertical size={24} />
	</Button>
</ContextMenuButton>
