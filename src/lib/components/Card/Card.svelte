<script lang="ts">
	import { setJellyfinItemUnwatched, setJellyfinItemWatched } from '$lib/apis/jellyfin/jellyfinApi';
	import { TMDB_BACKDROP_SMALL } from '$lib/constants';
	import { library } from '$lib/stores/library.store';
	import { formatMinutesToTime } from '$lib/utils';
	import classNames from 'classnames';
	import { Clock, Star } from 'radix-icons-svelte';
	import ContextMenu from '../ContextMenu/ContextMenu.svelte';
	import ContextMenuItem from '../ContextMenu/ContextMenuItem.svelte';
	import type { TitleType } from '$lib/types';
	import { openTitleModal } from '../Modal/Modal';

	export let tmdbId: number;
	export let jellyfinId: string | undefined = undefined;
	export let type: TitleType = 'movie';
	export let title: string;
	export let genres: string[] = [];
	export let runtimeMinutes = 0;
	export let seasons = 0;
	export let completionTime = '';
	export let backdropUri: string;
	export let rating: number;

	export let available = true;
	export let progress = 0;
	export let size: 'dynamic' | 'md' | 'lg' = 'md';
	export let openInModal = true;

	let watched = false;
	$: watched = !available && !!jellyfinId;

	function handleSetWatched() {
		if (jellyfinId) {
			setJellyfinItemWatched(jellyfinId).finally(() => library.refreshIn(3000));
		}
	}

	function handleSetUnwatched() {
		if (jellyfinId) {
			setJellyfinItemUnwatched(jellyfinId).finally(() => library.refreshIn(3000));
		}
	}
</script>

<ContextMenu heading={title} disabled={!jellyfinId}>
	<svelte:fragment slot="menu">
		<ContextMenuItem on:click={handleSetWatched} disabled={!jellyfinId || watched}>
			Mark as watched
		</ContextMenuItem>
		<ContextMenuItem on:click={handleSetUnwatched} disabled={!jellyfinId || !watched}>
			Mark as unwatched
		</ContextMenuItem>
	</svelte:fragment>
	<button
		class={classNames(
			'rounded overflow-hidden relative shadow-lg shrink-0 aspect-video selectable block hover:text-inherit',
			{
				'h-40': size === 'md',
				'h-60': size === 'lg',
				'w-full': size === 'dynamic'
			}
		)}
		on:click={() => {
			if (openInModal) {
				openTitleModal(tmdbId, type);
			} else {
				window.location.href = `/${type}/${tmdbId}`;
			}
		}}
	>
		<div
			style={'width: ' + (progress ? Math.max(progress, 2) : progress) + '%'}
			class="h-[2px] bg-zinc-200 bottom-0 absolute z-[1]"
		/>
		<div
			class="hidden sm:flex flex-col justify-between h-full w-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer p-2 px-3 relative z-[1] peer"
			style={progress > 0 ? 'padding-bottom: 0.6rem;' : ''}
		>
			<div class="text-left">
				<h1 class="font-bold tracking-wider text-lg">{title}</h1>
				<div class="text-xs text-zinc-300 tracking-wider font-medium">
					{genres.map((genre) => genre.charAt(0).toUpperCase() + genre.slice(1)).join(', ')}
				</div>
			</div>
			<div class="flex justify-between items-end">
				{#if completionTime}
					<div class="text-sm font-medium text-zinc-200 tracking-wide">
						Downloaded in <b
							>{formatMinutesToTime(
								(new Date(completionTime).getTime() - Date.now()) / 1000 / 60
							)}</b
						>
					</div>
				{:else}
					{#if runtimeMinutes}
						<div class="flex gap-1.5 items-center">
							<Clock />
							<div class="text-sm text-zinc-200">
								{progress
									? formatMinutesToTime(runtimeMinutes - runtimeMinutes * (progress / 100)) +
									  ' left'
									: formatMinutesToTime(runtimeMinutes)}
							</div>
						</div>
					{/if}
					{#if seasons}
						<div class="text-sm text-zinc-200">
							{seasons} Season{seasons > 1 ? 's' : ''}
						</div>
					{/if}

					<div class="flex gap-1.5 items-center">
						<Star />
						<div class="text-sm text-zinc-200">
							{rating ? rating.toFixed(1) : 'N/A'}
						</div>
					</div>
				{/if}
			</div>
		</div>
		<div
			style={"background-image: url('" + TMDB_BACKDROP_SMALL + backdropUri + "')"}
			class="absolute inset-0 bg-center bg-cover peer-hover:scale-105 transition-transform"
		/>
		<div
			class={classNames('absolute inset-0 transition-opacity', {
				'bg-darken opacity-0 peer-hover:opacity-100': available,
				'bg-[#00000055] peer-hover:bg-darken': !available
			})}
		/>
	</button>
</ContextMenu>
