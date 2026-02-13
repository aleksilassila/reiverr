<script lang="ts">
	import type { VideoTrack } from '$lib/apis/reiverr/reiverr.openapi';
	import { scrollIntoView } from '$lib/selectable';
	import { Check, TextAlignLeft, Video } from 'radix-icons-svelte';
	import Button from '../Button/Button.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import { useComponentStack } from '../StackRouter/stack-router.store';

	const { close } = useComponentStack();

	export let available: VideoTrack[];
	export let current: VideoTrack | undefined;
	export let selectVideoTrack: (videoTrack?: VideoTrack) => void;
</script>

<Dialog>
	<h1 class="h3 mb-4 flex items-center space-x-4">
		<span>Video Tracks</span>
		<Video size={32} />
	</h1>
	<div class="flex flex-col space-y-4 overflow-y-auto scrollbar-hide flex-1 px-4 -mx-4 py-2 -my-2">
		{#each available as videoTrack}
			<Button
				on:clickOrSelect={() => {
					close();
					selectVideoTrack(videoTrack);
				}}
				on:enter={scrollIntoView({ vertical: 64 })}
				class="relative"
			>
				{#if current?.url === videoTrack.url}
					<div class="absolute inset-y-0 right-6 flex items-center justify-center">
						<Check size={24} />
					</div>
				{/if}
				<div class="text-left">
					{videoTrack.label}
				</div>
			</Button>
		{/each}
	</div>
</Dialog>
