<script lang="ts">
	import type { LibraryEpisodeFileDto, ReleaseDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Container from '$lib/components/Container.svelte';
	import FloatingIconButton from '$lib/components/FloatingIconButton.svelte';
	import ListRow from '$lib/components/ListRow.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { PLATFORM_TV, TMDB_BACKDROP_SMALLEST } from '$lib/constants';
	import { usePageQuery } from '$lib/queries/page-query';
	import {
		clearPreference,
		episodeKey,
		seriesQueries,
		setPreference
	} from '$lib/queries/series.queries';
	import { confirmQuota, expectedBytes } from '$lib/quota';
	import { scrollIntoView } from '$lib/selectable';
	import { formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { Check, Cross1, Cross2 } from 'radix-icons-svelte';
	import HeroTitleInfo from '../HeroTitleInfo.svelte';

	export let tmdbId: string;
	export let season: number;
	/** Season packs are listed when there is no episode */
	export let episode: number | undefined = undefined;
	export let name: string;

	const componentStack = useComponentStack();
	const { background } = backgroundContext.getContext();
	const status = usePageQuery(seriesQueries.status(tmdbId));
	const tmdbSeries = usePageQuery(seriesQueries.metadata(tmdbId));
	const releases = usePageQuery(seriesQueries.releases(tmdbId, season, episode));
	// The files of the episode in the library, external or imported, which a request can have instead
	const files = usePageQuery(seriesQueries.episodeFiles(tmdbId, season, episode));
	$: requests = $status.data;

	$: selection = requests?.preferences.get(episodeKey(season, episode ?? 0));
	// An episode without a torrent of its own downloads from the season pack
	$: seasonPack =
		episode === undefined ? undefined : requests?.preferences.get(episodeKey(season, 0));
	// A request that has its file keeps it when another torrent is selected for the season
	$: kept = [...(requests?.episodes.values() ?? [])].filter(
		(e) =>
			e.season === season &&
			(episode === undefined || e.episode === episode) &&
			e.status === 'available' &&
			e.torrent?.infoHash !==
				(
					requests?.preferences.get(episodeKey(e.season, e.episode)) ??
					requests?.preferences.get(episodeKey(e.season, 0))
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
	$: fileList = $files.data ?? [];
	$: releaseList = $releases.data ?? [];

	$: hasFiles = fileList.length > 0;
	$: selectedFile = fileList.find((file) => file.id === selection?.file?.id);
	$: selectedRelease = releaseList.find(
		(release) => !!release.infoHash && release.infoHash === selection?.torrent?.infoHash
	);
	$: otherFiles = fileList.filter((file) => file !== selectedFile);
	$: otherReleases = releaseList.filter((release) => release !== selectedRelease);

	const releaseDetails = (release: ReleaseDto) =>
		`${release.seeders} seeders · ${release.peers} peers · ${formatSize(release.size)} · ${release.indexer}`;
	const fileDetails = (file: LibraryEpisodeFileDto) =>
		`${formatSize(file.size)} · ${file.infoHash ? 'On disk' : 'External'}`;
	// The preference's own snapshot, until the list that has the selected item loads
	$: selectedDetails = selectedRelease
		? releaseDetails(selectedRelease)
		: selectedFile
			? fileDetails(selectedFile)
			: selection?.torrent
				? `${formatSize(selection.torrent.size)} · ${selection.torrent.indexer}`
				: selection?.file
					? `${selection.file.size === undefined ? 'File' : formatSize(selection.file.size)}${selection.file.managed ? ' · Managed' : ''}${selection.file.inLibrary ? '' : ' · Not in the library'}`
					: '';

	const errorMessage = (e: any): string => e?.response?.data?.message ?? e?.message ?? String(e);

	/** The requests that would download from the release: the episode's, or those of the season without a torrent of their own that do not keep their file */
	$: affected = [...(requests?.episodes.values() ?? [])].filter(
		(e) =>
			e.requested &&
			e.season === season &&
			(episode === undefined
				? !requests?.preferences.has(episodeKey(e.season, e.episode)) && e.status !== 'available'
				: e.episode === episode)
	);
	$: episodesInSeason = $tmdbSeries.data?.seasons?.find((s) => s.season_number === season)?.episodes
		?.length;

	async function select(release: ReleaseDto) {
		error = '';

		try {
			const bytes =
				affected.length * expectedBytes(release.size, episode !== undefined, episodesInSeason);
			if (!(await confirmQuota(bytes))) return;

			await setPreference(tmdbId, season, episode, { releaseId: release.id });
			componentStack.close();
		} catch (e) {
			error = errorMessage(e);
		}
	}

	async function selectFile(file: LibraryEpisodeFileDto) {
		error = '';

		try {
			if (!(await confirmQuota(affected.length * file.size))) return;

			await setPreference(tmdbId, season, episode, { mediaFileId: file.id });
			componentStack.close();
		} catch (e) {
			error = errorMessage(e);
		}
	}

	async function clear() {
		error = '';

		await clearPreference(tmdbId, season, episode)
			.then(() => componentStack.close())
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
		<HeroTitleInfo
			title={name}
			overview=""
			properties={[{ label: episode === undefined ? 'Season packs' : 'Files and torrents' }]}
		/>
		{#if seasonPack && !selection}
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

		<div class="divider mt-4" />
	</Container>

	<div
		class="overflow-y-auto overflow-x-hidden scrollbar-hide pt-6 pb-16 mx-32"
		style="backface-visibility: hidden"
	>
		{#if selection}
			<div class="text-lg font-semibold text-secondary-400 mb-4">Selected</div>
			<div class="mb-8">
				<ListRow
					on:enter={scrollIntoView({ vertical: 96 })}
					on:clickOrSelect={clear}
					focusOnMount
					let:hasFocus
				>
					<div class="flex-1 min-w-0">
						<div class="text-2xl font-semibold line-clamp-1">
							{selection.torrent?.title ?? selection.file?.fileName}
						</div>
						<div class="text-lg font-medium text-secondary-400 mt-1">{selectedDetails}</div>
					</div>
					<!-- Focus and hover turn the marker into the action -->
					<div class="flex-shrink-0 ml-4 text-lg font-medium">
						<span
							class={classNames('items-center text-primary-500 group-hover:hidden', {
								flex: !hasFocus,
								hidden: hasFocus
							})}
						>
							<Check size={24} class="mr-2" />
						</span>
						<span
							class={classNames(
								'items-center text-primary-500 group-hover:flex',
								hasFocus ? 'flex' : 'hidden'
							)}
						>
							Unselect
							<Cross2 size={24} class="ml-2" />
						</span>
					</div>
				</ListRow>
			</div>
		{/if}
		{#if otherFiles.length}
			<div class="text-lg font-semibold text-secondary-400 mb-4">On disk</div>
			<div class="space-y-4">
				{#each otherFiles as file, index (file.id)}
					<ListRow
						on:enter={scrollIntoView({ vertical: 96 })}
						on:clickOrSelect={() => selectFile(file)}
						focusOnMount={index === 0 && !selection}
						let:hasFocus
					>
						<div class="flex-1 min-w-0">
							<div class="text-2xl font-semibold line-clamp-1">{file.fileName}</div>
							<div class="text-lg font-medium text-secondary-400 mt-1">{fileDetails(file)}</div>
						</div>
						<div class="flex-shrink-0 ml-4 text-lg font-medium">
							<span
								class={classNames(
									'items-center text-primary-500 group-hover:flex',
									hasFocus ? 'flex' : 'hidden'
								)}
							>
								Select
							</span>
						</div>
					</ListRow>
				{/each}
			</div>
		{/if}
		{#if selection || otherFiles.length}
			<div class="text-lg font-semibold text-secondary-400 mt-8 mb-4">Torrents</div>
		{/if}
		{#if $releases.isPending}
			<div class="text-2xl font-medium text-secondary-400 my-8">Searching indexers...</div>
		{:else if $releases.error}
			<div class="text-2xl font-medium text-red-400 my-8">{errorMessage($releases.error)}</div>
		{:else}
			<div class="space-y-4">
				{#each otherReleases as release, index (release.id)}
					{@const onServer = !!release.infoHash && !!requests?.onServer.has(release.infoHash)}
					<ListRow
						on:enter={scrollIntoView({ vertical: 96 })}
						on:clickOrSelect={() => select(release)}
						focusOnMount={index === 0 && !hasFiles && !selection}
						let:hasFocus
					>
						<div class="flex-1 min-w-0">
							<div class="text-2xl font-semibold line-clamp-1">{release.title}</div>
							<div class="text-lg font-medium text-secondary-400 mt-1">
								{releaseDetails(release)}
							</div>
						</div>
						<div class="flex-shrink-0 ml-4 text-lg font-medium">
							{#if onServer}
								<span
									class={classNames('text-secondary-300 group-hover:hidden', {
										hidden: hasFocus
									})}
								>
									On server
								</span>
							{/if}
							<span
								class={classNames(
									'items-center text-primary-500 group-hover:flex',
									hasFocus ? 'flex' : 'hidden'
								)}
							>
								Select
							</span>
						</div>
					</ListRow>
				{/each}
			</div>
			{#if !releaseList.length}
				<div class="text-2xl font-medium text-secondary-400 my-8">
					{episode === undefined
						? 'No season packs found for this season.'
						: 'No torrents found for this episode.'}
				</div>
			{/if}
		{/if}
	</div>
</Container>
