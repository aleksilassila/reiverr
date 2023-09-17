<script lang="ts">
	import { setJellyfinItemUnwatched, setJellyfinItemWatched } from '$lib/apis/jellyfin/jellyfinApi';
	import { jellyfinItemsStore } from '$lib/stores/data.store';
	import classNames from 'classnames';
	import { Check } from 'radix-icons-svelte';
	import { fade } from 'svelte/transition';
	import ContextMenu from '../ContextMenu/ContextMenu.svelte';
	import ContextMenuItem from '../ContextMenu/ContextMenuItem.svelte';
	import PlayButton from '../PlayButton.svelte';
	import ProgressBar from '../ProgressBar.svelte';
	import { playerState } from '../VideoPlayer/VideoPlayer';

	export let backdropUrl: string;

	export let title = '';
	export let subtitle = '';
	export let episodeNumber: string | undefined = undefined;
	export let runtime = 0;
	export let progress = 0;
	export let watched = false;
	export let airDate: Date | undefined = undefined;

	export let jellyfinId: string | undefined = undefined;

	export let size: 'md' | 'sm' | 'dynamic' = 'md';

	function handleSetWatched() {
		if (!jellyfinId) return;

		watched = true;
		progress = 0;
		setJellyfinItemWatched(jellyfinId).finally(() => jellyfinItemsStore.refreshIn(5000));
	}

	function handleSetUnwatched() {
		if (!jellyfinId) return;

		watched = false;
		setJellyfinItemUnwatched(jellyfinId).finally(() => jellyfinItemsStore.refreshIn(5000));
	}

	function handlePlay(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (!jellyfinId) return;

		playerState.streamJellyfinId(jellyfinId);
	}
</script>

<ContextMenu heading={subtitle}>
	<svelte:fragment slot="menu">
		<ContextMenuItem
			on:click={handleSetWatched}
			disabled={!handleSetWatched || watched || !jellyfinId}
		>
			Mark as watched
		</ContextMenuItem>
		<ContextMenuItem
			on:click={handleSetUnwatched}
			disabled={!handleSetUnwatched || !watched || !jellyfinId}
		>
			Mark as unwatched
		</ContextMenuItem>
	</svelte:fragment>
	<button
		on:click
		class={classNames(
			'aspect-video bg-center bg-cover rounded-lg overflow-hidden transition-opacity shadow-lg selectable flex-shrink-0 placeholder-image relative',
			'flex flex-col px-2 lg:px-3 py-2 gap-2 text-left',
			{
				'h-44': size === 'md',
				'h-36 lg:h-44': size === 'sm',
				'h-full': size === 'dynamic',
				group: !!jellyfinId,
				'cursor-default': !jellyfinId
			}
		)}
		style={"background-image: url('" + backdropUrl + "');"}
		in:fade|global={{ duration: 100, delay: 100 }}
		out:fade|global={{ duration: 100 }}
	>
		<div
			class={classNames(
				'absolute inset-0 transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0 bg-gradient-to-t',
				{
					'bg-darken': !jellyfinId || watched,
					'bg-gradient-to-t from-darken': !!jellyfinId
				}
			)}
		/>
		<div
			class={classNames(
				'flex-1 flex flex-col justify-between relative group-hover:opacity-0 group-focus-visible:opacity-0 transition-all',
				'text-xs lg:text-sm font-medium text-zinc-300',
				{
					'opacity-8': !jellyfinId || watched
				}
			)}
		>
			<div class="flex justify-between items-center">
				<div>
					<slot name="left-top">
						{#if airDate && airDate > new Date()}
							<p>
								{airDate.toLocaleString('en-US', {
									month: 'short',
									day: 'numeric',
									hour: 'numeric',
									minute: 'numeric'
								})}
							</p>
						{:else if episodeNumber}
							<p>{episodeNumber}</p>
						{/if}
					</slot>
				</div>
				<div>
					<slot name="right-top">
						{#if runtime && !progress}
							<p>
								{runtime.toFixed(0)} min
							</p>
						{:else if runtime && progress}
							<p>
								{(runtime - (runtime / 100) * progress).toFixed(0)} min left
							</p>
						{/if}
					</slot>
				</div>
			</div>
			<div class="flex items-end justify-between">
				<slot name="left-bottom">
					<div class="flex flex-col items-start">
						{#if subtitle}
							<h2 class="text-zinc-300 text-sm font-medium">{subtitle}</h2>
						{/if}
						{#if title}
							<h1 class="text-zinc-200 text-base font-medium text-left line-clamp-2">
								{title}
							</h1>
						{/if}
					</div>
				</slot>
				<slot name="right-bottom">
					{#if watched}
						<div class="flex-shrink-0">
							<Check size={20} class="opacity-80" />
						</div>
					{/if}
				</slot>
			</div>
		</div>
		{#if progress}
			<div class="relative group-hover:opacity-0 transition-opacity">
				<ProgressBar {progress} />
			</div>
		{/if}
		<div class="absolute inset-0 flex items-center justify-center">
			{#if jellyfinId}
				<PlayButton
					on:click={handlePlay}
					class="sm:opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
				/>
			{/if}
		</div>
	</button>
</ContextMenu>
