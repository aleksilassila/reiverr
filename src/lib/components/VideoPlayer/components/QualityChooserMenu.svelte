<script lang="ts">
	import {
		CardStack as QualityIcon,
		CaretLeft as CloseIcon,
		CaretRight as OpenIcon,
		Check
	} from 'radix-icons-svelte';
	import classNames from 'classnames';
	import { getQualities } from '$lib/apis/jellyfin/qualities';
	let qualities = getQualities(4096); // media.height
	export let selectedQuality = qualities[0];

    $: selectedQuality;
</script>

<media-menu class="w-80">
	<media-menu-button class="rounded-md bg-zinc-900/80">
		<QualityIcon slot="icon" />
		<span slot="label">Quality</span>
		<div slot="hint" class="flex-1 text-right">{selectedQuality.name || 'Original Quality'}</div>
		<CloseIcon slot="close-icon" />
		<OpenIcon slot="open-icon" />
	</media-menu-button>
	<media-menu-items class="rounded-md bg-zinc-900/80">
		<media-radio-group class="w-full rounded-md" value={selectedQuality}>
			{#each qualities as quality}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					aria-checked={quality.maxBitrate === selectedQuality.maxBitrate}
					on:click={() => (selectedQuality = quality)}
					class="
                    transition-colors
                    {selectedQuality.maxBitrate === quality.maxBitrate
						? 'text-amber-100'
						: 'text-zinc-500'}
                    py-1 px-2 cursor-pointer
                    "
				>
					<div class="flex items-center gap-1">
						<Check
							size={20}
							class={classNames({
								'opacity-0': !(selectedQuality.maxBitrate === quality.maxBitrate),
								'opacity-100': selectedQuality.maxBitrate === quality.maxBitrate
							})}
						/>

						<div class="flex items-center gap-2 justify-between w-full">
							<span class="font-bold">
								{quality.name.split('-')[0]}
							</span>
							<span> {quality.name.split('-')[1]} </span>
						</div>
					</div>
				</div>
			{/each}
		</media-radio-group>
	</media-menu-items>
</media-menu>
