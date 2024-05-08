<script lang="ts">
	import type { SubtitleInfo, Subtitles } from './VideoPlayer';
	import Button from '../Button.svelte';
	import { modalStack } from '../Modal/modal.store.js';
	import { scrollIntoView } from '../../selectable';
	import { Check, TextAlignLeft } from 'radix-icons-svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import { ISO_2_LANGUAGES } from '../../utils/iso-2-languages';

	export let modalId: symbol;

	export let subtitleInfo: SubtitleInfo | undefined;
	export let selectSubtitles: (subtitles?: Subtitles) => void;
</script>

<Dialog {modalId}>
	<h1 class="header2 mb-4 flex items-center space-x-4">
		<span>Subtitles</span>
		<TextAlignLeft size={32} />
	</h1>
	<div class="flex flex-col space-y-4">
		<Button
			on:clickOrSelect={() => {
				modalStack.close(modalId);
				selectSubtitles(undefined);
			}}
			class="relative"
		>
			{#if !subtitleInfo?.subtitles}
				<div class="absolute inset-y-0 right-6 flex items-center justify-center">
					<Check size={24} />
				</div>
			{/if}
			<div class="text-left">No Subtitles</div>
		</Button>
		{#each subtitleInfo?.availableSubtitles || [] as subtitles}
			<Button
				on:clickOrSelect={() => {
					modalStack.close(modalId);
					selectSubtitles(subtitles);
				}}
				on:enter={scrollIntoView({ horizontal: 64 })}
				class="relative"
			>
				{#if subtitleInfo?.subtitles?.url === subtitles.url}
					<div class="absolute inset-y-0 right-6 flex items-center justify-center">
						<Check size={24} />
					</div>
				{/if}
				<div class="text-left">
					{ISO_2_LANGUAGES[subtitles.srclang]?.name || subtitles.srclang}
				</div>
			</Button>
		{/each}
	</div>
</Dialog>
