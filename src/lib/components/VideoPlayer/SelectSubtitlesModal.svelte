<script lang="ts">
	import Button from '../Button.svelte';
	import { modalStack } from '../Modal/modal.store.js';
	import { scrollIntoView } from '../../selectable';
	import { Check, TextAlignLeft } from 'radix-icons-svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import { ISO_2_LANGUAGES } from '../../utils/iso-2-languages';
	import type { SubtitlesDto as Subtitles } from '$lib/apis/reiverr/reiverr.openapi';

	export let modalId: symbol;

	export let subtitles: Subtitles[];
	export let selectedSubtitles: Subtitles | undefined;
	export let selectSubtitles: (subtitles?: Subtitles) => void;
</script>

<Dialog {modalId}>
	<h1 class="h3 mb-4 flex items-center space-x-4">
		<span>Subtitles</span>
		<TextAlignLeft size={32} />
	</h1>
	<div class="flex flex-col space-y-4 overflow-y-auto scrollbar-hide flex-1 px-4 -mx-4 py-2 -my-2">
		<Button
			on:clickOrSelect={() => {
				modalStack.close(modalId);
				selectSubtitles(undefined);
			}}
			class="relative"
			on:enter={scrollIntoView({ vertical: 64 })}
		>
			{#if !selectedSubtitles}
				<div class="absolute inset-y-0 right-6 flex items-center justify-center">
					<Check size={24} />
				</div>
			{/if}
			<div class="text-left">No Subtitles</div>
		</Button>
		{#each subtitles as subtitles}
			<Button
				on:clickOrSelect={() => {
					modalStack.close(modalId);
					selectSubtitles(subtitles);
				}}
				on:enter={scrollIntoView({ vertical: 64 })}
				class="relative"
			>
				{#if selectedSubtitles?.src === subtitles.src}
					<div class="absolute inset-y-0 right-6 flex items-center justify-center">
						<Check size={24} />
					</div>
				{/if}
				<div class="text-left">
					{subtitles.label}
					<!-- {ISO_2_LANGUAGES[subtitles.lang]?.name || subtitles.lang} -->
				</div>
			</Button>
		{/each}
	</div>
</Dialog>
