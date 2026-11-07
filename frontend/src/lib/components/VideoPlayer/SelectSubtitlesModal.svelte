<script lang="ts">
	import Button from '../Button/Button.svelte';
	import { useComponentStack } from '../StackRouter/stack-router.store';
	import { scrollIntoView } from '$lib/selectable';
	import { Check, TextAlignLeft } from 'radix-icons-svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import { getLanguageName } from '../../utils/iso-2-languages';
	import type { SubtitleTrack } from './video-player.store';

	const { close } = useComponentStack();

	interface Props {
		available: SubtitleTrack[];
		current: SubtitleTrack | undefined;
		selectSubtitles: (subtitles?: SubtitleTrack) => void;
	}

	let { available, current, selectSubtitles }: Props = $props();
</script>

<Dialog>
	<h1 class="h3 mb-4 flex items-center space-x-4">
		<span>Subtitles</span>
		<TextAlignLeft size={32} />
	</h1>
	<div class="flex flex-col space-y-4 overflow-y-auto scrollbar-hide flex-1 px-4 -mx-4 py-2 -my-2">
		<Button
			onClickOrSelect={() => {
				close();
				selectSubtitles(undefined);
			}}
			class="relative"
			onEnter={scrollIntoView({ vertical: 64 })}
			type="primary-dark"
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
				onClickOrSelect={() => {
					close();
					selectSubtitles(subtitles);
				}}
				onEnter={scrollIntoView({ vertical: 64 })}
				class="relative"
				type="primary-dark"
			>
				{#if current?.id === subtitles.id}
					<div class="absolute inset-y-0 right-6 flex items-center justify-center">
						<Check size={24} />
					</div>
				{/if}
				<div class="text-left">
					{language ?? 'Unknown'}
					<span class="text-secondary-400">({subtitles.label})</span>
				</div>
			</Button>
		{/each}
	</div>
</Dialog>
