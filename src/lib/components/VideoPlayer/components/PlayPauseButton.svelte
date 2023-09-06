<script lang="ts">
	import { Play as PlayIcon, Pause as PauseIcon, Reload as ReplayIcon } from 'radix-icons-svelte';
</script>

<media-play-button class="text-zinc-400 h-8 w-8">
	<PlayIcon slot="play" />
	<PauseIcon slot="pause" />
	<ReplayIcon slot="replay" />
	<media-tooltip position="top" class="rounded-md bg-zinc-800/90 px-2.5 py-1.5 font-bold">
		<span slot="play">{'Play'}</span>
		<span slot="pause">{'Pause'}</span>
		<span slot="replay">{'Play again'}</span>
	</media-tooltip>
</media-play-button>
