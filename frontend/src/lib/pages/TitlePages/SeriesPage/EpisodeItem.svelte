<script lang="ts">
	import { getEpisodeRequestStatus, type SeriesData } from './episode-status';
	import RequestRow from './RequestRow.svelte';

	export let seasonNumber: number;
	export let episodeNumber: number;
	export let episodeName: string;
	export let data: SeriesData = {};

	$: status = getEpisodeRequestStatus(data, seasonNumber, episodeNumber);
</script>

<!-- The season pack is dimmed: it was not selected for this episode -->
<RequestRow
	subtitle={status.sourceName}
	subtitleDimmed={status.isSeasonPack}
	statusTags={status.tags}
	checked={status.requested}
	on:toggle
	on:open
	on:enter
>
	<span class="text-secondary-400">S{seasonNumber}E{episodeNumber}</span>
	{episodeName}
</RequestRow>
