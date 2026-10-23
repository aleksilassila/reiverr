<script lang="ts">
	import { toGigabytes } from '$lib/utils';
	import classNames from 'classnames';
	import ProgressBar from './ProgressBar.svelte';

	export let quotaBytes: number;
	/** What the requests of the user hold and wait for */
	export let usedBytes: number;

	// Over the quota the bar stands for what is used, and the part past the quota is red;
	// the figures are in the order and colors of the segments
	$: over = usedBytes > quotaBytes;
	$: progress = !usedBytes ? 0 : over ? quotaBytes / usedBytes : usedBytes / quotaBytes;
</script>

<div class={classNames('min-w-64', $$restProps.class)}>
	<div class="flex justify-between items-baseline mb-2 space-x-4">
		<div class="uppercase text-secondary-200 font-semibold tracking-wider text-lg">Quota</div>
		<div class="font-semibold text-lg text-secondary-100 tabular-nums">
			<span class={over ? 'error' : ''}>{toGigabytes(usedBytes)}</span>
			<span class="text-secondary-500">/ {toGigabytes(quotaBytes)} GB</span>
		</div>
	</div>
	<ProgressBar {progress} excess={over ? 1 - progress : 0} />
</div>
