<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { getEpisodeRequestStatus, type SeriesData } from './episode-status';
	import RequestRow from '$lib/components/RequestRow.svelte';

	interface Props {
		onToggle?: ComponentProps<typeof RequestRow>['onToggle'];
		onOpen?: ComponentProps<typeof RequestRow>['onOpen'];
		onEnter?: ComponentProps<typeof RequestRow>['onEnter'];
		seasonNumber: number;
		episodeNumber: number;
		episodeName: string;
		data?: SeriesData;
	}

	let {
		seasonNumber,
		episodeNumber,
		episodeName,
		data = {},
		onToggle,
		onOpen,
		onEnter
	}: Props = $props();

	let status = $derived(getEpisodeRequestStatus(data, seasonNumber, episodeNumber));
</script>

<!-- The season pack is dimmed: it was not selected for this episode -->
<RequestRow
	subtitle={status.sourceName}
	subtitleDimmed={status.isSeasonPack}
	statusTags={status.tags}
	checked={status.requested}
	{onToggle}
	{onOpen}
	{onEnter}
>
	<span class="text-secondary-400">S{seasonNumber}E{episodeNumber}</span>
	{episodeName}
</RequestRow>
