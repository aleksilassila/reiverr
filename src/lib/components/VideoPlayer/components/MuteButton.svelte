<script lang="ts">
	import {
		SpeakerLoud as VolumeHighIcon,
		SpeakerQuiet as VolumeLowIcon,
		SpeakerOff as MuteIcon
	} from 'radix-icons-svelte';
</script>

<media-mute-button
	class="group flex h-7 w-7 items-center justify-center rounded-sm text-zinc-400 outline-none data-[focus]:ring-4 data-[focus]:ring-amber-600"
>
	<!-- icons -->
    <MuteIcon class="hidden group-data-[volume=muted]:block" type="mute"/>
    <VolumeLowIcon class="hidden group-data-[volume=low]:block" type="volume-low" />
    <VolumeHighIcon class="hidden group-data-[volume=high]:block" type="volume-high"/>
	<!-- tooltip -->
	<media-tooltip
		class="rounded-md bg-zinc-800/90 px-2.5 py-1.5 font-bold"
	>
		<span class="not-muted:inline hidden">Mute</span>
		<span class="muted:inline hidden">Unmute</span>
	</media-tooltip>
</media-mute-button>
