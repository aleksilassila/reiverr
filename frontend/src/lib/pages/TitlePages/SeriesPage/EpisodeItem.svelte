<script lang="ts">
	import { getEpisodeRequestStatus, type SeriesRequests } from '$lib/stores/data/series-data.store';
	import RequestRow from './RequestRow.svelte';

	export let seasonNumber: number;
	export let episodeNumber: number;
	export let episodeName: string;
	export let requests: SeriesRequests | undefined = undefined;

	$: status = getEpisodeRequestStatus(requests, seasonNumber, episodeNumber);
	// The torrent of the season pack is shown on the season
	$: ownSelection = status.selection?.episode ? status.selection : undefined;
</script>

<RequestRow
	title={`S${seasonNumber}E${episodeNumber} - ${episodeName}`}
	subtitle={ownSelection?.torrent.title}
	status={status.label}
	isError={status.isError}
	checked={status.requested}
	on:toggle
	on:open
/>
