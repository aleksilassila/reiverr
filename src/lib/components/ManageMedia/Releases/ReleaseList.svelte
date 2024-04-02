<script lang="ts">
	import { type RadarrRelease } from '../../../apis/radarr/radarr-api';
	import classNames from 'classnames';
	import { useRequest } from '../../../stores/data.store';
	import Button from '../../Button.svelte';
	import { ChevronRight, DotFilled } from 'radix-icons-svelte';
	import { formatMinutesToTime, formatSize } from '../../../utils';
	import { derived } from 'svelte/store';
	import ButtonGhost from '../../Ghosts/ButtonGhost.svelte';

	export let id: number;
	export let getReleases: (id: number) => Promise<RadarrRelease[]>;
	export let selectRelease: (release: RadarrRelease) => void;

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
			<div class="flex-1 my-1">
				<Button on:click={() => selectRelease(release)} let:hasFocus focusOnMount={index === 0}>
					<div class="w-full flex">
						<div class="flex-1 flex flex-col mr-2">
							<div class="flex-1 flex items-center">
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
						{#if hasFocus}
							<div class="flex items-center">
								<ChevronRight size={32} />
							</div>
						{:else}
							<div
								class={classNames({
									'text-zinc-400': !hasFocus,
									'text-zinc-700': hasFocus
								})}
							>
								{formatSize(release?.size || 0)}
							</div>
						{/if}
					</div>
				</Button>
				<!--				<Button-->
				<!--					on:click={() =>-->
				<!--						!isFetching &&-->
				<!--						!isGrabbed &&-->
				<!--						handleGrabRelease(release.guid || '', release.indexerId || 0, release.title || '')}-->
				<!--					inactive={isFetching || isGrabbed}-->
				<!--					let:hasFocus-->
				<!--					focusOnMount={index === 0}-->
				<!--				>-->
				<!--					<div class="w-full flex flex-col">-->
				<!--						<div class="flex-1 flex items-center">-->
				<!--							{#if !isGrabbed}-->
				<!--								<Plus size={19} class="mr-2" />-->
				<!--							{:else}-->
				<!--								<Download size={19} class="mr-2" />-->
				<!--							{/if}-->
				<!--							<div class="flex-1 flex mr-2">-->
				<!--								<div class="tracking-wide mr-2">{release.indexer}</div>-->
				<!--								<div-->
				<!--									class={classNames('mr-2', {-->
				<!--										'text-zinc-400': !hasFocus,-->
				<!--										'text-zinc-700': hasFocus-->
				<!--									})}-->
				<!--								>-->
				<!--									{release?.quality?.quality?.name}-->
				<!--								</div>-->
				<!--								<div-->
				<!--									class={classNames('mr-2', {-->
				<!--										'text-zinc-400': !hasFocus,-->
				<!--										'text-zinc-700': hasFocus-->
				<!--									})}-->
				<!--								>-->
				<!--									{release.seeders} seeders-->
				<!--								</div>-->
				<!--							</div>-->
				<!--							<div>-->
				<!--								<div-->
				<!--									class={classNames({-->
				<!--										'text-zinc-400': !hasFocus,-->
				<!--										'text-zinc-700': hasFocus-->
				<!--									})}-->
				<!--								>-->
				<!--									{formatSize(release?.size || 0)}-->
				<!--								</div>-->
				<!--							</div>-->
				<!--						</div>-->
				<!--						{#if hasFocus}-->
				<!--							<div class="flex text-xs text-zinc-700 items-center flex-wrap mt-2">-->
				<!--								<div>-->
				<!--									{release.title}-->
				<!--								</div>-->
				<!--								<DotFilled size={15} />-->
				<!--								<div>{formatMinutesToTime(release.ageMinutes || 0)} old</div>-->
				<!--								<DotFilled size={15} />-->
				<!--								<div><b>{release.seeders} seeders</b> / {release.leechers} leechers</div>-->
				<!--								<DotFilled size={15} />-->
				<!--								{#if release.seeders}-->
				<!--									<div>-->
				<!--										{formatSize((release.size || 0) / release.seeders)} per seeder-->
				<!--									</div>-->
				<!--								{/if}-->
				<!--							</div>-->
				<!--						{/if}-->
				<!--					</div>-->
				<!--				</Button>-->
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
