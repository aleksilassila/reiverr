<script lang="ts">
	import { type RadarrRelease } from '../../apis/radarr/radarr-api';
	import type { SonarrRelease } from '../../apis/sonarr/sonarrApi';
	import classNames from 'classnames';
	import { useRequest } from '../../stores/data.store';
	import Button from '../Button.svelte';
	import { DotFilled, Download, Plus } from 'radix-icons-svelte';
	import { formatMinutesToTime, formatSize } from '../../utils';
	import { derived } from 'svelte/store';
	import ButtonGhost from '../Ghosts/ButtonGhost.svelte';
	import Container from '../../../Container.svelte';
	import { scrollWithOffset } from '../../selectable';

	export let id: number;
	export let getReleases: (id: number) => Promise<(RadarrRelease | SonarrRelease)[]>;
	export let grabRelease: (guid: string, indexerId: number) => Promise<boolean>;

	let showAll = false;

	const { data: releases, isLoading } = useRequest(getReleases, id);

	const filteredReleases = derived(releases, ($releases) => {
		if (!$releases) return [];
		let filtered = $releases.slice();

		filtered.sort((a, b) => (b.seeders || 0) - (a.seeders || 0));
		filtered = (filtered as any)
			.filter((release: any) => release?.quality?.quality?.resolution > 720)
			.slice(0, 5);

		filtered.sort((a, b) => (b.size || 0) - (a.size || 0));

		return filtered;
	});

	const isFetchingGrab: Record<string, boolean> = {};
	const grabbedReleases: Record<string, boolean> = {};
	function handleGrabRelease(guid: string, indexerId: number) {
		isFetchingGrab[guid] = true;
		grabRelease(guid, indexerId).then((ok) => {
			isFetchingGrab[guid] = false;
			if (ok) {
				grabbedReleases[guid] = true;
			}
		});
	}
</script>

<div class="flex flex-col -my-1">
	{#if $isLoading}
		{#each new Array(5) as _, index}
			<div class="flex-1 my-1">
				<ButtonGhost />
			</div>
		{/each}
	{:else}
		{#each (showAll ? $releases : $filteredReleases)?.filter((r) => r.guid && r.indexerId) || [] as release, index}
			{@const isFetching = isFetchingGrab[release.guid || ''] || false}
			{@const isGrabbed = grabbedReleases[release.guid || ''] || false}
			<div class="flex-1 my-1">
				<Button
					on:click={() =>
						!isFetching &&
						!isGrabbed &&
						handleGrabRelease(release.guid || '', release.indexerId || 0)}
					inactive={isFetching || isGrabbed}
					let:hasFocus
					focusOnMount={index === 0}
				>
					<div class="w-full flex flex-col">
						<div class="flex-1 flex items-center">
							{#if !isGrabbed}
								<Plus size={19} class="mr-2" />
							{:else}
								<Download size={19} class="mr-2" />
							{/if}
							<div class="flex-1 flex mr-2">
								<div class="tracking-wide mr-2">{release.indexer}</div>
								<div
									class={classNames('mr-2', {
										'text-zinc-400': !hasFocus,
										'text-zinc-700': hasFocus
									})}
								>
									{release?.quality?.quality?.name}
								</div>
								<div
									class={classNames('mr-2', {
										'text-zinc-400': !hasFocus,
										'text-zinc-700': hasFocus
									})}
								>
									{release.seeders} seeders
								</div>
							</div>
							<div>
								<div
									class={classNames({
										'text-zinc-400': !hasFocus,
										'text-zinc-700': hasFocus
									})}
								>
									{formatSize(release?.size || 0)}
								</div>
							</div>
						</div>
						{#if hasFocus}
							<div class="flex text-xs text-zinc-700 items-center flex-wrap mt-2">
								<div>
									{release.title}
								</div>
								<DotFilled size={15} />
								<div>{formatMinutesToTime(release.ageMinutes || 0)} old</div>
								<DotFilled size={15} />
								<div><b>{release.seeders} seeders</b> / {release.leechers} leechers</div>
								<DotFilled size={15} />
								{#if release.seeders}
									<div>
										{formatSize((release.size || 0) / release.seeders)} per seeder
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</Button>
			</div>
		{/each}
		{#if !showAll && $releases?.length}
			<div class="my-1 w-full">
				<Button on:click={() => (showAll = true)}>Show all {$releases?.length} releases</Button>
			</div>
		{:else if showAll}
			<div class="my-1 w-full">
				<Button on:click={() => (showAll = false)}>Show less</Button>
			</div>
		{/if}
	{/if}
</div>
