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
		class="ease pointer-events-none absolute bottom-full left-1/2 mb-4 -translate-x-1/2 translate-y-2.5 scale-75 whitespace-nowrap rounded-sm bg-black py-1 px-2 font-sans text-xs text-white opacity-0 transition-all duration-200 group-data-[hocus]:-translate-x-1/2 group-data-[hocus]:scale-100 group-data-[hocus]:opacity-100"
		style="transform-origin: 50% 100%"
	>
		<span class="not-muted:inline hidden">Mute</span>
		<span class="muted:inline hidden">Unmute</span>
	</media-tooltip>
</media-mute-button>
