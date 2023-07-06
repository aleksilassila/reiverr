<script lang="ts">
	import RadarrIcon from '../components/svgs/RadarrIcon.svelte';
	import SonarrIcon from '../components/svgs/SonarrIcon.svelte';
	import { formatSize } from '$lib/utils.js';
	import RadarrStats from '../components/SourceStats/RadarrStats.svelte';
	import SonarrStats from '../components/SourceStats/SonarrStats.svelte';
</script>

<div class="pt-24 px-8 min-h-screen flex justify-center">
	<div class="flex flex-col gap-4 max-w-3xl flex-1">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<RadarrStats large />
		<div
			class="border-zinc-800 border-2 border-dashed relative w-full p-3 px-4 rounded-xl overflow-hidden text-zinc-500 text-center flex flex-col gap-1"
		>
			<h2 class="font-medium">Sonarr is not set up</h2>
			<p class="text-sm">
				To set up Sonarr, define the <code>SONARR_API_KEY</code> and <code>SONARR_URL</code> environment
				variables.
			</p>
		</div>
		<SonarrStats large />
	</div>
	<!--	<div>Sources</div>-->
	<!--	<div>Streaming services</div>-->
	<!--	<div>(P2P network?)</div>-->
	<!--	<div>Configure Sonarr</div>-->
	<!--	<div>Configure Radarr</div>-->
	<!--	<div>(Configure Plex)</div>-->
	<!--	<div>(Configure Jellyfinn)</div>-->
	<!--	<div>(Configure IMDB)</div>-->
	<!--	<div>(Configure TMDB)</div>-->
</div>
