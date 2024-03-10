<script lang="ts">
	import { Gear as SettingIcon } from 'radix-icons-svelte';
	import { createEventDispatcher } from 'svelte';
	import QualityChooserMenu from './QualityChooserMenu.svelte';
	import CaptionChooserMenu from './CaptionChooserMenu.svelte';
	let position = 'top';
	let tooltip = 'top';
	let selectedQuality = {
		name: '',
		maxBitrate: 0,
		minResolution: 0
	};

	const dispatch = createEventDispatcher();
	$: selectedQuality && dispatch('qualityupdate', selectedQuality);
</script>

<media-menu {position} part="settings-menu">
	<media-menu-button class="h-8 w-8 text-zinc-400">
		<SettingIcon rotate class="h-5" />
		<media-tooltip position={tooltip} class="rounded-md bg-zinc-800/90 px-2.5 py-1.5 font-bold"
			>{'Settings'}
		</media-tooltip>
	</media-menu-button>
	<media-menu-items class="rounded-md bg-black/80 p-2">
		<!-- <media-menu>
        <media-audio-menu-button label={'Audio'} />
        <media-audio-menu-items emptyLabel={'Default'} />
      </media-menu> -->
		<!-- <media-menu>
        <media-playback-rate-menu-button $prop:label={'Speed'} />
        <media-playback-rate-menu-items $prop:normalLabel={'Normal'} />
      </media-menu> -->
		<QualityChooserMenu bind:selectedQuality />
	  	<CaptionChooserMenu />
	</media-menu-items>
</media-menu>
