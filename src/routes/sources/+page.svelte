<script lang="ts">
	import RadarrIcon from '../components/svgs/RadarrIcon.svelte';
	import SonarrIcon from '../components/svgs/SonarrIcon.svelte';
	import { formatSize } from '$lib/utils.js';
</script>

<div class="pt-24 px-8 min-h-screen flex justify-center">
	<div class="flex flex-col gap-4 max-w-3xl flex-1">
		<div
			class="bg-highlight-dim relative w-full p-3 px-4 rounded-xl overflow-hidden group pointer"
			on:click={() => (window.location.href = '/')}
		>
			<div class="absolute left-0 inset-y-0 w-[70%] bg-[#ffffff22]" />
			<RadarrIcon class="absolute opacity-20 p-4 h-full inset-y-0 right-2" />
			<div class="relative z-[1] flex flex-col justify-between gap-2">
				<div class="flex flex-col flex-1">
					<h3 class="text-zinc-400 font-medium text-xs tracking-wider">Mac-Mini</h3>
					<a
						href="/"
						class="text-zinc-200 font-bold text-xl tracking-wide group-hover:text-amber-200"
						>Radarr</a
					>
				</div>
				<div class="flex gap-8">
					<div class="flex flex-col items-center gap-0.5">
						<h3 class="uppercase text-zinc-400 font-medium text-xs tracking-wider">Movies</h3>
						<div class="font-medium text-sm">30</div>
					</div>
					<div class="flex flex-col items-center gap-0.5">
						<h3 class="uppercase text-zinc-400 font-medium text-xs tracking-wider">Space Taken</h3>
						<div class="font-medium text-sm">{formatSize(120_000_000_000)}</div>
					</div>
					<div class="flex flex-col items-center gap-0.5">
						<h3 class="uppercase text-zinc-400 font-medium text-xs tracking-wider">Space Left</h3>
						<div class="font-medium text-sm">{formatSize(50_000_000_000)}</div>
					</div>
				</div>
			</div>
		</div>
		<div
			class="border-zinc-800 border-2 border-dashed relative w-full p-3 px-4 rounded-xl overflow-hidden text-zinc-500 text-center flex flex-col gap-1"
		>
			<h2 class="font-medium">Sonarr is not set up</h2>
			<p class="text-sm">
				To set up Sonarr, define the <code>SONARR_API_KEY</code> and <code>SONARR_URL</code> environment
				variables.
			</p>
		</div>
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
