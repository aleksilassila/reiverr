<script lang="ts">
	import type { LocalEpisodeFileDto, ReleaseDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Button from '$lib/components/Button/Button.svelte';
	import Container from '$lib/components/Container.svelte';
	import FloatingIconButton from '$lib/components/FloatingIconButton.svelte';
	import ListRow from '$lib/components/ListRow.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { PLATFORM_TV, TMDB_BACKDROP_SMALLEST } from '$lib/constants';
	import { scrollIntoView } from '$lib/selectable';
	import { episodeKey, useSeriesContext } from '$lib/stores/data/series-data.store';
	import { reiverrApi, user } from '$lib/stores/user.store';
	import { formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { Check, Cross1, Cross2 } from 'radix-icons-svelte';
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

	$: selection = $requests?.preferences.get(episodeKey(season, episode ?? 0));
	// An episode without a torrent of its own downloads from the season pack
	$: seasonPack =
		episode === undefined ? undefined : $requests?.preferences.get(episodeKey(season, 0));
	// A request that has its file keeps it when another torrent is selected for the season
	$: kept = [...($requests?.episodes.values() ?? [])].filter(
		(e) =>
			e.season === season &&
			(episode === undefined || e.episode === episode) &&
			e.status === 'available' &&
			e.torrent?.infoHash !==
				(
					$requests?.preferences.get(episodeKey(e.season, e.episode)) ??
					$requests?.preferences.get(episodeKey(e.season, 0))
				)?.torrent?.infoHash
	);
	$: keptHint = !kept.length
		? ''
		: episode === undefined
			? `${kept.length} ${kept.length === 1 ? 'episode keeps its file' : 'episodes keep their files'}. Select a torrent for an episode to replace it.`
			: kept[0]?.torrent
				? `On disk from: ${kept[0].torrent.title}. Select a torrent or a file to replace it.`
				: 'On disk. Select a torrent or a file to replace it.';

	let error = '';
	const releases: Promise<ReleaseDto[]> = reiverrApi.indexers
		.searchSeriesReleases(tmdbId, { season, episode })
		.then((r) => r.data);
	// The files of the episode in the library, external or imported, which a request can have instead
	const files: Promise<LocalEpisodeFileDto[]> =
		episode === undefined
			? Promise.resolve([])
			: reiverrApi.localMedia
					.getEpisodeFiles(tmdbId, season, episode)
					.then((r) => r.data)
					.catch(() => []);
	let hasFiles = false;
	files.then((f) => (hasFiles = f.length > 0));

	const errorMessage = (e: any): string => e?.response?.data?.message ?? e?.message ?? String(e);

	async function select(release: ReleaseDto) {
		error = '';

		await (
			episode === undefined
				? reiverrApi.requests.setSeasonPreference($user?.id as string, tmdbId, season, {
						releaseId: release.id
					})
				: reiverrApi.requests.setEpisodePreference($user?.id as string, tmdbId, season, episode, {
						releaseId: release.id
					})
		)
			.then(() => {
				componentStack.close();
				seriesData.requestsData?.update();
			})
			.catch((e) => (error = errorMessage(e)));
	}

	async function selectFile(file: LocalEpisodeFileDto) {
		error = '';

		await reiverrApi.requests
			.setEpisodePreference($user?.id as string, tmdbId, season, episode as number, {
				mediaFileId: file.id
			})
			.then(() => {
				componentStack.close();
				seriesData.requestsData?.update();
			})
			.catch((e) => (error = errorMessage(e)));
	}

	async function clear() {
		error = '';

		await (
			episode === undefined
				? reiverrApi.requests.clearSeasonPreference($user?.id as string, tmdbId, season)
				: reiverrApi.requests.clearEpisodePreference($user?.id as string, tmdbId, season, episode)
		)
			.then(() => {
				seriesData.requestsData?.update();
			})
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
	class={classNames('relative flex flex-col min-h-screen bg-primary-900/50 h-screen')}
	on:back={({ detail }) => {
		componentStack.close();
		detail.stopPropagation();
	}}
>
	{#if !PLATFORM_TV}
		<div class="absolute top-8 right-8">
			<FloatingIconButton on:click={() => componentStack.close()}>
				<Cross1 size={24} />
			</FloatingIconButton>
		</div>
	{/if}
	<Container class="mx-32 mt-16">
		<div class="flex items-end justify-between">
			<div class="min-w-0">
				<HeroTitleInfo
					title={name}
					overview=""
					properties={[{ label: episode === undefined ? 'Season packs' : 'Files and torrents' }]}
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
				Selected: {selection.torrent?.title ?? selection.file?.fileName}
				{#if selection.file && !selection.file.inLibrary}(not in the library){/if}
			</div>
		{:else if seasonPack}
			<div class="text-lg font-medium text-secondary-500 mt-4 line-clamp-1">
				From the season pack: {seasonPack.torrent?.title}
			</div>
		{/if}
		{#if keptHint}
			<div class="text-lg font-medium text-secondary-500 mt-1 line-clamp-1">{keptHint}</div>
		{/if}
		{#if error}
			<div class="text-lg font-medium text-red-400 mt-4">{error}</div>
		{/if}

		<!-- Divider -->
		<div class="h-px w-full bg-secondary-700 mt-4"></div>
	</Container>

	<div
		class="overflow-y-auto overflow-x-hidden scrollbar-hide pt-6 pb-16 mx-32"
		style="backface-visibility: hidden"
	>
		{#await files then files}
			{#if files.length}
				<div class="text-lg font-semibold text-secondary-400 mb-4">On disk</div>
				<div class="space-y-4">
					{#each files as file, index (file.id)}
						{@const selected = file.id === selection?.file?.id}
						<ListRow
							on:enter={scrollIntoView({ vertical: 96 })}
							on:clickOrSelect={() => selectFile(file)}
							focusOnMount={index === 0}
						>
							<div class="flex-1 min-w-0">
								<div class="text-2xl font-semibold line-clamp-1">{file.fileName}</div>
								<div class="text-lg font-medium text-secondary-400 mt-1">
									{formatSize(file.size)} · {file.infoHash ? 'Imported' : 'External'}{file.managed
										? ' · Managed'
										: ''}
								</div>
							</div>
							{#if selected}
								<div
									class="flex-shrink-0 ml-4 flex items-center text-lg font-medium text-primary-500"
								>
									<Check size={24} class="mr-2" />
									Selected
								</div>
							{/if}
						</ListRow>
					{/each}
				</div>
				<div class="text-lg font-semibold text-secondary-400 mt-8 mb-4">Torrents</div>
			{/if}
		{/await}
		{#await releases}
			<div class="text-2xl font-medium text-secondary-400 my-8">Searching indexers...</div>
		{:then releases}
			<div class="space-y-4">
				{#each releases as release, index (release.id)}
					{@const selected =
						release.id === selection?.releaseId ||
						(!!release.infoHash && release.infoHash === selection?.torrent?.infoHash)}
					{@const onServer = !!release.infoHash && !!$requests?.onServer.has(release.infoHash)}
					<ListRow
						on:enter={scrollIntoView({ vertical: 96 })}
						on:clickOrSelect={() => select(release)}
						focusOnMount={index === 0 && !hasFiles}
					>
						<div class="flex-1 min-w-0">
							<div class="text-2xl font-semibold line-clamp-1">{release.title}</div>
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
					</ListRow>
				{:else}
					<div class="text-2xl font-medium text-secondary-400 my-8">
						{episode === undefined
							? 'No season packs found for this season.'
							: 'No torrents found for this episode.'}
					</div>
				{/each}
			</div>
		{:catch e}
			<div class="text-2xl font-medium text-red-400 my-8">{errorMessage(e)}</div>
		{/await}
	</div>
</Container>
