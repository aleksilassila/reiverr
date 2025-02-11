<script lang="ts">
	import type { AudioTrack, SubtitleInfo, Subtitles } from './VideoPlayer';
	import Button from '../Button.svelte';
	import { modalStack } from '../Modal/modal.store.js';
	import { scrollIntoView } from '../../selectable';
	import { ChatBubble, Check, TextAlignLeft } from 'radix-icons-svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import { ISO_2_LANGUAGES } from '../../utils/iso-2-languages';

	export let modalId: symbol;

	export let selectedAudioStreamIndex: number;
	export let audioTracks: AudioTrack[];
	export let selectAudioStream: (index: number) => void;
	export let onClose = () => {};
</script>

<Dialog {modalId}>
	<div>
		<h1 class="h3 mb-4 flex items-center space-x-4">
			<span>Audio</span>
			<ChatBubble size={32} />
		</h1>
		<div class="flex flex-col space-y-4">
			{#each audioTracks || [] as track}
				<Button
					on:clickOrSelect={() => {
						modalStack.close(modalId);
						onClose();
						if (track.index !== selectedAudioStreamIndex) selectAudioStream(track.index);
					}}
					on:enter={scrollIntoView({ horizontal: 64 })}
					class="relative"
				>
					{#if track.index === selectedAudioStreamIndex}
						<div class="absolute inset-y-0 right-6 flex items-center justify-center">
							<Check size={24} />
						</div>
					{/if}
					<div class="text-left">
						{ISO_2_LANGUAGES[track.language]?.name || track.language}
					</div>
				</Button>
			{/each}
		</div>
	</div>
</Dialog>
