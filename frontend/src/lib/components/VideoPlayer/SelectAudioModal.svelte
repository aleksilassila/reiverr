<script lang="ts">
	import { scrollIntoView } from '$lib/selectable';
	import { Check, SpeakerLoud } from 'radix-icons-svelte';
	import { getLanguageName } from '../../utils/iso-2-languages';
	import Button from '../Button/Button.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import { useComponentStack } from '../StackRouter/stack-router.store';
	import type { AudioTrack } from './video-player.store';

	const { close } = useComponentStack();

	export let available: AudioTrack[];
	export let current: AudioTrack | undefined;
	export let selectAudioTrack: (audioTrack: AudioTrack) => void;
</script>

<Dialog>
	<h1 class="h3 mb-4 flex items-center space-x-4">
		<span>Audio</span>
		<SpeakerLoud size={32} />
	</h1>
	<div class="flex flex-col space-y-4 overflow-y-auto scrollbar-hide flex-1 px-4 -mx-4 py-2 -my-2">
		{#each available as audioTrack}
			{@const language =
				audioTrack.lang && (getLanguageName(audioTrack.lang.replace(/-.*/, '')) ?? audioTrack.lang)}
			<Button
				on:clickOrSelect={() => {
					close();
					selectAudioTrack(audioTrack);
				}}
				on:enter={scrollIntoView({ vertical: 64 })}
				class="relative"
				type="primary-dark"
			>
				{#if current?.index === audioTrack.index}
					<div class="absolute inset-y-0 right-6 flex items-center justify-center">
						<Check size={24} />
					</div>
				{/if}
				<div class="text-left">
					{audioTrack.label || language || `Track ${audioTrack.index + 1}`}
					{#if audioTrack.label && language}
						<span class="text-secondary-400">({language})</span>
					{/if}
				</div>
			</Button>
		{/each}
	</div>
</Dialog>
