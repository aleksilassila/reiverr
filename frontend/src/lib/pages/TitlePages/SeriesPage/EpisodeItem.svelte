<script lang="ts">
	import { getEpisodeRequestStatus, type SeriesRequests } from '$lib/queries/series.queries';
	import RequestRow from './RequestRow.svelte';

	export let seasonNumber: number;
	export let episodeNumber: number;
	export let episodeName: string;
	export let requests: SeriesRequests | undefined = undefined;

	$: status = getEpisodeRequestStatus(requests, seasonNumber, episodeNumber);
</script>

<!-- The season pack is dimmed: it was not selected for this episode -->
<RequestRow
	subtitle={status.torrent?.title ?? status.file?.fileName}
	subtitleDimmed={status.isSeasonPack}
	status={status.label}
	isError={status.isError}
	checked={status.requested}
	on:toggle
	on:open
	on:enter
>
	<span class="text-secondary-400">S{seasonNumber}E{episodeNumber}</span>
	{episodeName}
</RequestRow>
