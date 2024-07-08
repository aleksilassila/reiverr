<script lang="ts">
	import { formatMinutesToTime, formatSize } from '../../../utils.js';
	import type { RadarrRelease } from '../../../apis/radarr/radarr-api';
	import type { SonarrRelease } from '../../../apis/sonarr/sonarr-api';
	import { scrollIntoView } from '../../../selectable';
	import { Check, Download, Play } from 'radix-icons-svelte';
	import TableRow from '../../Table/TableRow.svelte';
	import type { GrabReleaseFn } from '../MediaManagerModal';
	import TableButton from '../../Table/TableButton.svelte';
	import TableCell from '../../Table/TableCell.svelte';
	import Container from '../../../../Container.svelte';
	import { playerState } from '../../VideoPlayer/VideoPlayer';

	export let release: RadarrRelease | SonarrRelease;

	export let grabRelease: GrabReleaseFn;
	let fetching = false;
	let didGrab = false;

	function handleGrabRelease() {
		fetching = true;
		grabRelease(release).then((ok) => {
			fetching = false;
			didGrab = ok;
		});
	}

	function handleStreamRelease() {
		release.magnetUrl && playerState.streamMagnetLink(release.magnetUrl);
	}
</script>

<TableRow class="font-medium">
	<TableCell>
		<div>
			<h2 class="text-sm font-medium text-zinc-300 mb-1">
				{formatMinutesToTime(release.ageMinutes || 0)} ago
			</h2>
			<h1 class="font-medium text-lg">{release.title}</h1>
		</div>
	</TableCell>
	<TableCell class="text-zinc-300">
		{formatSize(release.size || 0)}
	</TableCell>
	<TableCell class="text-zinc-300">
		<div
			class="px-3 py-1 rounded bg-secondary-700 flex items-center justify-center float-left text-sm"
		>
			{release.seeders} / {release.leechers}
		</div>
	</TableCell>
	<TableCell class="text-zinc-300">
		<div
			class="px-3 py-1 rounded bg-secondary-700 flex items-center justify-center float-left text-sm"
		>
			{release.quality?.quality?.name}
		</div>
	</TableCell>
	<TableCell>
		<Container direction="horizontal">
			<TableButton
				disabled={didGrab || fetching}
				on:clickOrSelect={handleGrabRelease}
				on:enter={scrollIntoView({ vertical: 128 })}
			>
				<svelte:component this={didGrab ? Check : Download} size={19} />
			</TableButton>

			<TableButton
				on:clickOrSelect={handleStreamRelease}
				on:enter={scrollIntoView({ vertical: 128 })}
			>
				<svelte:component this={Play} size={19} />
			</TableButton>
		</Container>
	</TableCell>
</TableRow>
