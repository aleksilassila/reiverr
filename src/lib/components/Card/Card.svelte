<script lang="ts">
	import { TMDB_BACKDROP_SMALL } from '$lib/constants';
	import { createLibraryItemStore } from '$lib/stores/library.store';
	import type { TitleType } from '$lib/types';
	import { formatMinutesToTime } from '$lib/utils';
	import classNames from 'classnames';
	import { Clock, Star } from 'radix-icons-svelte';
	import ContextMenu from '../ContextMenu/ContextMenu.svelte';
	import LibraryItemContextItems from '../ContextMenu/LibraryItemContextItems.svelte';
	import { openTitleModal } from '../Modal/Modal';
	import ProgressBar from '../ProgressBar.svelte';

	export let tmdbId: number;
	export let type: TitleType = 'movie';
	export let title: string;
	export let genres: string[] = [];
	export let runtimeMinutes = 0;
	export let seasons = 0;
	export let completionTime = '';
	export let backdropUrl: string;
	export let rating: number;

	export let available = true;
	export let progress = 0;
	export let size: 'dynamic' | 'md' | 'lg' = 'md';
	export let openInModal = true;

	let itemStore = createLibraryItemStore(tmdbId);
</script>

<ContextMenu heading={title}>
	<svelte:fragment slot="menu">
		<LibraryItemContextItems {itemStore} {type} {tmdbId} />
	</svelte:fragment>
	<button
		class={classNames(
			'rounded overflow-hidden relative shadow-lg shrink-0 aspect-video selectable hover:text-inherit flex flex-col justify-between group placeholder-image',
			'p-2 px-3 gap-2',
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
			style={"background-image: url('" + backdropUrl + "')"}
			class="absolute inset-0 bg-center bg-cover group-hover:scale-105 group-focus-visible:scale-105 transition-transform"
		/>
		<div
			class={classNames(
				'absolute inset-0 transition-opacity bg-darken sm:bg-opacity-100 bg-opacity-50',
				{
					'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100': available
				}
			)}
		/>
		<div
			class="flex flex-col justify-between flex-1 transition-opacity cursor-pointer relative opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
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

					{#if rating}
						<div class="flex gap-1.5 items-center">
							<Star />
							<div class="text-sm text-zinc-200">
								{rating.toFixed(1)}
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>
		{#if progress}
			<div class="relative">
				<ProgressBar {progress} />
			</div>
		{/if}
	</button>
</ContextMenu>
