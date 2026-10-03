<script lang="ts">
	import Button from '../Button/Button.svelte';
	import { useComponentStack } from '../StackRouter/stack-router.store';
	import { scrollIntoView } from '$lib/selectable';
	import { Check, TextAlignLeft } from 'radix-icons-svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import { getLanguageName } from '../../utils/iso-2-languages';
	import type { SubtitleTrack } from './video-player.store';

	const { close } = useComponentStack();

	export let available: SubtitleTrack[];
	export let current: SubtitleTrack | undefined;
	export let selectSubtitles: (subtitles?: SubtitleTrack) => void;
</script>

<Dialog>
	<h1 class="h3 mb-4 flex items-center space-x-4">
		<span>Subtitles</span>
		<TextAlignLeft size={32} />
	</h1>
	<div class="flex flex-col space-y-4 overflow-y-auto scrollbar-hide flex-1 px-4 -mx-4 py-2 -my-2">
		<Button
			on:clickOrSelect={() => {
				close();
				selectSubtitles(undefined);
			}}
			class="relative"
			on:enter={scrollIntoView({ vertical: 64 })}
		>
			{#if !current}
				<div class="absolute inset-y-0 right-6 flex items-center justify-center">
					<Check size={24} />
				</div>
			{/if}
			<div class="text-left">No Subtitles</div>
		</Button>
		{#each available as subtitles}
			{@const language = subtitles.lang && getLanguageName(subtitles.lang)}
			<Button
				on:clickOrSelect={() => {
					close();
					selectSubtitles(subtitles);
				}}
				on:enter={scrollIntoView({ vertical: 64 })}
				class="relative"
			>
				{#if current?.id === subtitles.id}
					<div class="absolute inset-y-0 right-6 flex items-center justify-center">
						<Check size={24} />
					</div>
				{/if}
				<div class="text-left">
					{subtitles.label}
					{#if language}
						<span class="text-secondary-400">({language})</span>
					{/if}
				</div>
			</Button>
		{/each}
	</div>
</Dialog>
