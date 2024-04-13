<script lang="ts">
	import { jellyfinApi, type JellyfinItem } from '../../apis/jellyfin/jellyfin-api';
	import Card from './Card.svelte';

	export let item: JellyfinItem;
	export let size: 'dynamic' | 'md' | 'lg' | 'sm' | undefined = undefined;

	console.log(item, item.ProviderIds?.Tmdb);
</script>

<Card
	tmdbId={Number(item.ProviderIds?.Tmdb) || 0}
	jellyfinId={item.Id}
	title={item.Name || undefined}
	subtitle={item.Genres?.join(', ') || undefined}
	backdropUrl={jellyfinApi.getPosterUrl(item, 80)}
	type={item.Type === 'Movie' ? 'movie' : 'series'}
	{size}
	orientation="portrait"
	rating={item.CommunityRating || undefined}
	on:enter
/>
