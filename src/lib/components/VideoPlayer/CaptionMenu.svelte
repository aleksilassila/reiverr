<script lang="ts">
	import type { TextTrack } from 'vidstack';
	import { Bell } from 'radix-icons-svelte';
	export let tracks: Partial<TextTrack>[];

	const onChange = (event: any) => console.log('sub changed!', event.target.value);

	console.log(tracks);
</script>

<media-menu class="">
	<media-menu-button aria-label="Settings">
		<!-- <media-icon type="settings" data-rotate /> -->
		<Bell />
	</media-menu-button>
	<media-menu-items style="--menu-height: 66px;">
		<media-menu>
			<media-menu-button>
				<media-icon type="arrow-left" slot="close-icon" />
				<media-icon type="closed-captions" slot="icon" />
				<span slot="label">Subtitles</span>
				<span class="ml-auto hint-text">{tracks.find((item) => item.default)}</span>
				<media-icon class="ml-0" type="chevron-right" slot="open-icon" />
			</media-menu-button>
			<media-menu-items>
				<media-radio-group on:change={onChange}>
					<media-radio value="off">Off</media-radio>
					{#each tracks as track}
						<media-radio value={track.index}>{track.label}</media-radio>
					{/each}
				</media-radio-group>
			</media-menu-items>
		</media-menu>
		<media-menu />
	</media-menu-items>
</media-menu>
