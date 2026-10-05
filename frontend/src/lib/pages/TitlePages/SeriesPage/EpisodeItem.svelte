<script lang="ts">
	import { getEpisodeRequestStatus, type SeriesRequests } from '$lib/stores/data/series-data.store';
	import RequestRow from './RequestRow.svelte';

	export let seasonNumber: number;
	export let episodeNumber: number;
	export let episodeName: string;
	export let requests: SeriesRequests | undefined = undefined;

	$: status = getEpisodeRequestStatus(requests, seasonNumber, episodeNumber);
</script>

<!-- The season pack is dimmed: it was not selected for this episode -->
<RequestRow
	title={`S${seasonNumber}E${episodeNumber} - ${episodeName}`}
	subtitle={status.torrent?.title}
	subtitleDimmed={status.isSeasonPack}
	status={status.label}
	isError={status.isError}
	checked={status.requested}
	on:toggle
	on:open
/>
