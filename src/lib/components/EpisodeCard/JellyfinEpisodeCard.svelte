<script lang="ts">
	import EpisodeCard from './EpisodeCard.svelte';
	import { jellyfinApi, type JellyfinItem } from '../../apis/jellyfin/jellyfin-api';
	import { playerState } from '../VideoPlayer/VideoPlayer';
	import { tmdbApi } from '../../apis/tmdb/tmdb-api';

	export let episode: JellyfinItem;

	function handlePlay() {
		const id = episode?.Id;
		if (id) playerState.streamJellyfinId(id);
	}
</script>

<EpisodeCard
	episodeNumber={episode.IndexNumber ?? 0}
	episodeName={episode.Name ?? ''}
	backdropUrl={jellyfinApi.getBackdrop(episode)}
	{handlePlay}
/>
