<script lang="ts">
	import {
		EnterFullScreen as EnterFullScreenIcon,
		ExitFullScreen as ExitFullScreenIcon
	} from 'radix-icons-svelte';
</script>

<media-fullscreen-button class="text-zinc-400 h-8 w-8">
	<EnterFullScreenIcon slot="enter" class="h-5"/>
	<ExitFullScreenIcon slot="exit" class="h-5" />
	<media-tooltip position="top right" class="rounded-md bg-zinc-800/90 px-2.5 py-1.5 font-bold">
		<span slot="enter">{'Enter Fullscreen'}</span>
		<span slot="exit">{'Exit Fullscreen'}</span>
	</media-tooltip>
</media-fullscreen-button>
