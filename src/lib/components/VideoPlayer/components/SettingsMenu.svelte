<script lang="ts">
	import { Gear as SettingIcon } from 'radix-icons-svelte';
	import QualityChooserMenu from './QualityChooserMenu.svelte';
	let position = 'top';
	let tooltip = 'top';
</script>

<media-menu {position} part="settings-menu">
	<media-menu-button class="h-8 w-8 text-zinc-400">
		<SettingIcon rotate />
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
		<QualityChooserMenu />
		<media-menu class="w-80">
			<media-captions-menu-button label={'Captions'} class="rounded-md bg-zinc-900/80" />
			<media-captions-menu-items
				offLabel={'Off'}
				class="relative w-full flex flex-col p-0 aria-hidden:hidden rounded-md bg-zinc-900/80"
				radio-group-class="w-full"
				radio-class="group flex text-zinc-300 cursor-pointer items-center p-2.5 data-[hocus]:bg-amber-300/20 data-[focus]:ring-2 data-[focus]:ring-amber-500"
				radio-check-class="rounded-full border-4 flex items-center justify-center w-2.5 h-2.5 mr-2 group-aria-checked:border-amber-400 border-zinc-600 after:content-[''] after:hidden  group-aria-checked:after:inline-block after:rounded-full after:w-1 after:h-1"
			/>
		</media-menu>
	</media-menu-items>
</media-menu>
