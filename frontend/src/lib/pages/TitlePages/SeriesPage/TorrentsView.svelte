<script lang="ts">
	import type { ReleaseDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Button from '$lib/components/Button/Button.svelte';
	import Container from '$lib/components/Container.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { TMDB_BACKDROP_SMALLEST } from '$lib/constants';
	import { scrollElementIntoView } from '$lib/scroll-into-view';
	import { episodeKey, useSeriesContext } from '$lib/stores/data/series-data.store';
	import { reiverrApi } from '$lib/stores/user.store';
	import { formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { Check, Cross2 } from 'radix-icons-svelte';
	import { readable } from 'svelte/store';
	import HeroTitleInfo from '../HeroTitleInfo.svelte';

	export let tmdbId: string;
	export let season: number;
	/** Season packs are listed when there is no episode */
	export let episode: number | undefined = undefined;
	export let name: string;

	const componentStack = useComponentStack();
	const { background } = backgroundContext.getContext();
	const seriesData = useSeriesContext(tmdbId).getContext();
	const requests = seriesData.requestsData?.data ?? readable(undefined);

	$: selection = $requests?.selections.get(episodeKey(season, episode ?? 0));

	let error = '';
	const releases: Promise<ReleaseDto[]> = reiverrApi.indexers
		.searchSeriesReleases(tmdbId, { season, episode })
		.then((r) => r.data);

	const errorMessage = (e: any): string => e?.response?.data?.message ?? e?.message ?? String(e);

	async function select(release: ReleaseDto) {
		error = '';

		await (
			episode === undefined
				? reiverrApi.downloads.selectSeasonRelease(tmdbId, season, { releaseId: release.id })
				: reiverrApi.downloads.selectEpisodeRelease(tmdbId, season, episode, {
						releaseId: release.id
					})
		)
			.then(() => seriesData.requestsData?.update())
			.then(() => componentStack.close())
			.catch((e) => (error = errorMessage(e)));
	}

	async function clear() {
		error = '';

		await (
			episode === undefined
				? reiverrApi.downloads.clearSeasonRelease(tmdbId, season)
				: reiverrApi.downloads.clearEpisodeRelease(tmdbId, season, episode)
		)
			.then(() => seriesData.requestsData?.update())
			.catch((e) => (error = errorMessage(e)));
	}
</script>

<div class="fixed inset-0 scale-110 z-[-1]">
	<div
		class="absolute inset-0 bg-secondary-900 bg-center bg-cover bg-no-repeat blur-md brightness-[0.2] saturate-50"
		style={$background?.backdropUri
			? `background-image: url('${TMDB_BACKDROP_SMALLEST}${$background?.backdropUri}');`
			: ''}
	/>
</div>

<Container
	class={classNames('flex flex-col min-h-screen bg-primary-900/50 h-screen')}
	on:back={({ detail }) => {
		componentStack.close();
		detail.stopPropagation();
	}}
>
	<Container class="mx-32 mt-16">
		<div class="flex items-end justify-between">
			<div class="min-w-0">
				<HeroTitleInfo
					title={name}
					overview=""
					properties={[{ label: episode === undefined ? 'Season packs' : 'Episode torrents' }]}
				/>
			</div>
			{#if selection}
				<Button class="flex-shrink-0 ml-8" type="secondary" icon={Cross2} action={clear}>
					Remove Selection
				</Button>
			{/if}
		</div>
		{#if selection}
			<div class="text-lg font-medium text-secondary-300 mt-4 line-clamp-1">
				Selected: {selection.torrent.title}
			</div>
		{/if}
		{#if error}
			<div class="text-lg font-medium text-red-400 mt-4">{error}</div>
		{/if}

		<!-- Divider -->
		<div class="h-px w-full bg-secondary-700 mt-4"></div>
	</Container>

	<div
		class="overflow-y-auto overflow-x-hidden scrollbar-hide pb-16 mx-32"
		style="backface-visibility: hidden"
	>
		{#await releases}
			<div class="text-2xl font-medium text-secondary-400 my-8">Searching indexers...</div>
		{:then releases}
			{#each releases as release, index (release.id)}
				{@const selected =
					release.id === selection?.releaseId ||
					(!!release.infoHash && release.infoHash === selection?.torrent.infoHash)}
				{@const onServer = !!release.infoHash && !!$requests?.onServer.has(release.infoHash)}
				<Container
					on:enter={({ detail }) => {
						const el =
							detail.selectable.getSibling(-1)?.getHtmlElement() ??
							detail.selectable?.getHtmlElement();

						if (el) scrollElementIntoView(el, { top: 32 });
					}}
					on:clickOrSelect={() => select(release)}
					focusOnMount={index === 0}
					focusOnClick
					let:hasFocus
				>
					<div class="cursor-pointer my-6 flex items-center">
						<div class="flex-1 min-w-0">
							<div
								class={classNames('text-2xl font-semibold line-clamp-1', {
									'text-secondary-500': !hasFocus && !selected,
									'text-secondary-200': !hasFocus && selected,
									'text-primary-500': hasFocus
								})}
							>
								{release.title}
							</div>
							<div class="text-lg font-medium text-secondary-400 mt-1">
								{release.seeders} seeders · {release.peers} peers · {formatSize(release.size)} · {release.indexer}
							</div>
						</div>
						{#if selected}
							<div
								class="flex-shrink-0 ml-4 flex items-center text-lg font-medium text-primary-500"
							>
								<Check size={24} class="mr-2" />
								Selected
							</div>
						{:else if onServer}
							<div class="flex-shrink-0 ml-4 text-lg font-medium text-secondary-300">On server</div>
						{/if}
					</div>
				</Container>
			{:else}
				<div class="text-2xl font-medium text-secondary-400 my-8">
					{episode === undefined
						? 'No season packs found for this season.'
						: 'No torrents found for this episode.'}
				</div>
			{/each}
		{:catch e}
			<div class="text-2xl font-medium text-red-400 my-8">{errorMessage(e)}</div>
		{/await}
	</div>
</Container>
