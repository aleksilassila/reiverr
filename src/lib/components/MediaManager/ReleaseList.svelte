<script lang="ts">
	import { type RadarrRelease } from '../../apis/radarr/radarr-api';
	import classNames from 'classnames';
	import { useRequest } from '../../stores/data.store';
	import { derived } from 'svelte/store';
	import ButtonGhost from '../Ghosts/ButtonGhost.svelte';
	import type { SonarrRelease } from '../../apis/sonarr/sonarr-api';
	import Container from '../../../Container.svelte';
	import MMReleaseListRow from '../MediaManagerModal/MMReleaseListRow.svelte';
	import AnimateScale from '../AnimateScale.svelte';

	type Release = RadarrRelease | SonarrRelease;

	export let getReleases: () => Promise<Release[]>;
	export let selectRelease: (release: Release) => void;

	let showAll = false;

	const { data: releases, isLoading } = useRequest(getReleases);

	const filteredReleases = derived(releases, ($releases) => {
		if (!$releases) return [];
		let filtered = $releases.slice();

		const releaseIsEnough = (r: Release) => r?.quality?.quality?.resolution || 0 > 720;
		filtered.sort((a, b) => (b.seeders || 0) - (a.seeders || 0));
		filtered.sort((a, b) => (releaseIsEnough(b) ? 1 : 0) - (releaseIsEnough(a) ? 1 : 0));
		filtered = filtered.slice(0, 5);

		filtered.sort((a, b) => (b.size || 0) - (a.size || 0));

		return filtered;
	});
</script>

<table class="w-full border-spacing-y-2 border-spacing-x-2 border-separate -mx-8">
	{#if $isLoading}
		{#each new Array(5) as _, index}
			<div class="flex-1 my-2">
				<ButtonGhost />
			</div>
		{/each}
	{:else}
		<thead>
			<Container tag="tr" direction="horizontal">
				<Container tag="th" let:hasFocus>
					<AnimateScale {hasFocus} class="ml-8">
						<div
							class={classNames('float-left rounded-full px-3 py-1', {
								'bg-primary-500 text-secondary-800': hasFocus
							})}
						>
							Title
						</div>
					</AnimateScale>
				</Container>
				<Container tag="th" let:hasFocus>
					<AnimateScale {hasFocus}>
						<div
							class={classNames('float-left rounded-full px-3 py-1', {
								'bg-primary-500 text-secondary-800': hasFocus
							})}
						>
							Size
						</div>
					</AnimateScale>
				</Container>
				<Container tag="th" let:hasFocus>
					<AnimateScale {hasFocus}>
						<div
							class={classNames('float-left rounded-full px-3 py-1', {
								'bg-primary-500 text-secondary-800': hasFocus
							})}
						>
							Peers
						</div>
					</AnimateScale>
				</Container>
				<Container tag="th" let:hasFocus>
					<AnimateScale {hasFocus}>
						<div
							class={classNames('float-left rounded-full px-3 py-1', {
								'bg-primary-500 text-secondary-800': hasFocus
							})}
						>
							Quality
						</div>
					</AnimateScale>
				</Container>
				<th />
			</Container>
		</thead>
		<Container focusOnMount tag="tbody" class="">
			{#each $filteredReleases?.filter((r) => r.guid && r.indexerId) || [] as release, index}
				<MMReleaseListRow {release} />
			{/each}
		</Container>
		<h1 class="text-2xl font-semibold mb-4 mt-8 mx-8">All Releases</h1>
		<tbody class="divide-y divide-zinc-500">
			{#each $releases?.filter((r) => r.guid && r.indexerId) || [] as release, index}
				<MMReleaseListRow {release} />
			{/each}
		</tbody>
	{/if}
</table>
<!--{#if !showAll && $releases?.length}-->
<!--	<div class="my-1 w-full">-->
<!--		<Button on:clickOrSelect={() => (showAll = true)}>Show all {$releases?.length} releases</Button>-->
<!--	</div>-->
<!--{:else if showAll}-->
<!--	<div class="my-1 w-full">-->
<!--		<Button on:clickOrSelect={() => (showAll = false)}>Show less</Button>-->
<!--	</div>-->
<!--{/if}-->
