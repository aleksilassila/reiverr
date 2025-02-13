<script lang="ts">
	import Container from '$components/Container.svelte';
	import { scrollIntoView } from '$lib/selectable';
	import classNames from 'classnames';
	import { ChevronRight } from 'radix-icons-svelte';
	import type { MediaSource, StreamCandidateDto } from '../../apis/reiverr/reiverr.openapi';
	import Modal from '../../components/Modal/Modal.svelte';
	import { sources } from '../../stores/user.store';
	import { capitalize } from '../../utils';

	export let modalId: symbol;
	export let getStreams: (source: MediaSource) => Promise<StreamCandidateDto[]>;
	export let selectStream: (source: MediaSource, stream: StreamCandidateDto) => void;

	let selectedSource: MediaSource | undefined = undefined;
	let streams: Record<string, Promise<StreamCandidateDto[]>> = {};

	function selectSource(source: MediaSource) {
		selectedSource = source;
	}

	const updateStreams = (source: MediaSource) => {
		streams[source.id] = getStreams(source);
		streams = streams;
	};
	$: {
		if (selectedSource && !streams[selectedSource.id]) {
			updateStreams(selectedSource);
		}
	}
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.key === 'Escape') {
			if (selectedSource !== undefined) {
				selectedSource = undefined;
			}
		}
	}}
/>

<Modal {modalId}>
	<Container
		class="h-screen py-16 px-32 bg-primary-800 space-y-8 overflow-y-auto flex flex-col"
		on:back={(e) => {
			if (selectedSource !== undefined) {
				selectedSource = undefined;
				e.detail.stopPropagation();
			}
		}}
	>
		{#if !selectedSource}
			{#each $sources as { source }}
				<Container
					on:clickOrSelect={() => selectSource(source)}
					let:hasFocus
					class="cursor-pointer"
				>
					<span
						class={classNames('text-3xl font-semibold flex items-center', {
							'text-secondary-400': !hasFocus,
							'text-primary-100': hasFocus
						})}
					>
						{capitalize(source.name)}
						{#if hasFocus}
							<ChevronRight class="w-8 h-8 ml-4" />
						{/if}
					</span>
				</Container>
			{:else}
				<div class="h-ghost m-auto">No sources available</div>
			{/each}
		{:else}
			{@const s = selectedSource}
			{#await streams[selectedSource.id]}
				<h1 class="h-ghost m-auto">Loading...</h1>
			{:then streams}
				{#each streams ?? [] as stream}
					<Container
						on:clickOrSelect={() => selectStream(s, stream)}
						on:enter={scrollIntoView({ vertical: 64 })}
						let:hasFocus
						class="cursor-pointer"
					>
						<span
							class={classNames('text-3xl font-semibold flex items-center', {
								'text-secondary-400': !hasFocus,
								'text-primary-100': hasFocus
							})}
						>
							{capitalize(stream.title)}
							<!-- {#if hasFocus}
								<Play class="w-8 h-8 ml-4" />
							{/if} -->
						</span>
						<span class="text-secondary-400">
							{stream.properties?.map((p) => `${p.label}: ${p.formatted || p.value}`).join(', ')}
						</span>
					</Container>
				{:else}
					<div class="h-ghost m-auto">No streams available</div>
				{/each}
			{/await}
		{/if}
	</Container>
</Modal>
