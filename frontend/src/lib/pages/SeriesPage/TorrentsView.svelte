<script lang="ts">
	import type { MediaFileDto, ReleaseDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Container from '$lib/components/Container.svelte';
	import FloatingIconButton from '$lib/components/FloatingIconButton.svelte';
	import HeroTitleInfo from '$lib/components/HeroShowcase/HeroTitleInfo.svelte';
	import ListRow from '$lib/components/ListRow.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { PLATFORM_TV, TMDB_BACKDROP_SMALLEST } from '$lib/constants';
	import { downloadsQueries } from '$lib/queries/downloads.queries';
	import { indexersQueries } from '$lib/queries/indexers.queries';
	import { libraryQueries } from '$lib/queries/library.queries';
	import { metadataQueries } from '$lib/queries/metadata.queries';
	import { usePageQuery } from '$lib/queries/page-query';
	import {
		clearSeriesSource,
		episodeKey,
		requestsQueries,
		setSeriesSource
	} from '$lib/queries/requests.queries';
	import { confirmQuota, expectedBytes } from '$lib/quota';
	import { getOnServer, heldFileOf } from '$lib/request-status';
	import { scrollIntoView } from '$lib/selectable';
	import { formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { Check, Cross1, Cross2 } from 'radix-icons-svelte';

	interface Props {
		tmdbId: string;
		season: number;
		/** Season packs are listed when there is no episode */
		episode?: number | undefined;
		name: string;
	}

	let { tmdbId, season, episode = undefined, name }: Props = $props();

	const componentStack = useComponentStack();
	const { background } = backgroundContext.getContext();
	const requestsQuery = usePageQuery(() => requestsQueries.series(tmdbId));
	const status = usePageQuery(() => libraryQueries.seriesStatus(tmdbId));
	const torrents = usePageQuery(() => downloadsQueries.seriesTorrents(tmdbId));
	const tmdbSeries = usePageQuery(() => metadataQueries.series(tmdbId));
	const releases = usePageQuery(() => indexersQueries.seriesReleases(tmdbId, season, episode));
	let requests = $derived(requestsQuery.data);
	// The requests of the season or the episode
	let requestList = $derived(
		[...(requests?.requests.values() ?? [])].filter(
			(r) => r.season === season && (episode === undefined || r.episode === episode)
		)
	);

	let selection = $derived(requests?.sources.get(episodeKey(season, episode ?? 0)));
	// An episode without a torrent of its own downloads from the season pack
	let seasonPack = $derived(
		episode === undefined ? undefined : requests?.sources.get(episodeKey(season, 0))
	);
	// A request that has its file keeps it when another torrent is selected for the season
	let kept = $derived(
		requestList.flatMap((r) => {
			const file = heldFileOf(status.data?.fulfilments.get(r.id), status.data?.files);
			const selected =
				requests?.sources.get(episodeKey(r.season, r.episode)) ??
				requests?.sources.get(episodeKey(r.season, 0));

			return file && file.infoHash !== selected?.release?.infoHash ? [file] : [];
		})
	);
	let keptTorrent = $derived(kept[0]?.infoHash ? torrents.data?.get(kept[0].infoHash) : undefined);
	let keptHint = $derived(
		!kept.length
			? ''
			: episode === undefined
				? `${kept.length} ${kept.length === 1 ? 'episode keeps its file' : 'episodes keep their files'}. Select a torrent for an episode to replace it.`
				: keptTorrent
					? `On disk from: ${keptTorrent.title}. Select a torrent or a file to replace it.`
					: 'On disk. Select a torrent or a file to replace it.'
	);

	let error = $state('');
	// The files of the episode in the library, external or imported, which a request can have instead
	let fileList = $derived(
		(status.data?.files ?? []).filter(
			(file) => episode !== undefined && file.season === season && file.episodes.includes(episode)
		)
	);
	let releaseList = $derived(releases.data ?? []);
	// The torrents that have the release already, which selecting downloads nothing anew from
	let onServer = $derived(getOnServer(torrents.data, status.data?.files));

	let hasFiles = $derived(fileList.length > 0);
	let selectedFile = $derived(fileList.find((file) => file.id === selection?.mediaFileId));
	let selectedRelease = $derived(
		releaseList.find(
			(release) => !!release.infoHash && release.infoHash === selection?.release?.infoHash
		)
	);
	let otherFiles = $derived(fileList.filter((file) => file !== selectedFile));
	let otherReleases = $derived(releaseList.filter((release) => release !== selectedRelease));

	const releaseDetails = (release: ReleaseDto) =>
		`${release.seeders} seeders · ${release.peers} peers · ${formatSize(release.size)} · ${release.indexer}`;
	const fileDetails = (file: MediaFileDto) =>
		`${formatSize(file.size)} · ${file.infoHash ? 'On disk' : 'External'}`;
	// The selected release as it was picked, until the list that has it loads; a selected file that is gone says so
	let selectedTitle = $derived(
		selection?.release?.title ?? selectedFile?.fileName ?? 'File not in the library'
	);
	let selectedDetails = $derived(
		selectedRelease
			? releaseDetails(selectedRelease)
			: selectedFile
				? fileDetails(selectedFile)
				: selection?.release
					? `${formatSize(selection.release.size)} · ${selection.release.indexer}`
					: ''
	);

	const errorMessage = (e: any): string => e?.response?.data?.message ?? e?.message ?? String(e);

	/** The requests that would download from the release: the episode's, or those of the season without a torrent of their own that do not keep their file */
	let affected = $derived(
		requestList.filter(
			(r) =>
				episode !== undefined ||
				(!requests?.sources.has(episodeKey(r.season, r.episode)) &&
					status.data?.fulfilments.get(r.id)?.status !== 'fulfilled')
		)
	);
	let episodesInSeason = $derived(
		tmdbSeries.data?.seasons?.find((s) => s.season_number === season)?.episodes?.length
	);

	async function select(release: ReleaseDto) {
		error = '';

		try {
			const bytes =
				affected.length * expectedBytes(release.size, episode !== undefined, episodesInSeason);
			if (!(await confirmQuota(bytes))) return;

			await setSeriesSource(tmdbId, season, episode, { releaseId: release.id });
			componentStack.close();
		} catch (e) {
			error = errorMessage(e);
		}
	}

	async function selectFile(file: MediaFileDto) {
		error = '';

		try {
			if (!(await confirmQuota(affected.length * file.size))) return;

			await setSeriesSource(tmdbId, season, episode, { mediaFileId: file.id });
			componentStack.close();
		} catch (e) {
			error = errorMessage(e);
		}
	}

	async function clear() {
		error = '';

		await clearSeriesSource(tmdbId, season, episode)
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
	></div>
</div>

<Container
	class={classNames('relative flex flex-col min-h-screen bg-primary-900/50 h-screen')}
	onBack={(e) => {
		componentStack.close();
		e.stopPropagation();
	}}
>
	{#if !PLATFORM_TV}
		<div class="absolute top-8 right-8">
			<FloatingIconButton onclick={() => componentStack.close()}>
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
				From the season pack: {seasonPack.release?.title}
			</div>
		{/if}
		{#if keptHint}
			<div class="text-lg font-medium text-secondary-500 mt-1 line-clamp-1">{keptHint}</div>
		{/if}
		{#if error}
			<div class="text-lg font-medium text-red-400 mt-4">{error}</div>
		{/if}

		<div class="divider mt-4"></div>
	</Container>

	<div
		class="overflow-y-auto overflow-x-hidden scrollbar-hide pt-6 pb-16 mx-32"
		style="backface-visibility: hidden"
	>
		{#if selection}
			<div class="text-lg font-semibold text-secondary-400 mb-4">Selected</div>
			<div class="mb-8">
				<ListRow onEnter={scrollIntoView({ vertical: 96 })} onClickOrSelect={clear} focusOnMount>
					{#snippet children({ hasFocus })}
						<div class="flex-1 min-w-0">
							<div class="text-2xl font-semibold line-clamp-1">{selectedTitle}</div>
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
					{/snippet}
				</ListRow>
			</div>
		{/if}
		{#if otherFiles.length}
			<div class="text-lg font-semibold text-secondary-400 mb-4">On disk</div>
			<div class="space-y-4">
				{#each otherFiles as file, index (file.id)}
					<ListRow
						onEnter={scrollIntoView({ vertical: 96 })}
						onClickOrSelect={() => selectFile(file)}
						focusOnMount={index === 0 && !selection}
					>
						{#snippet children({ hasFocus })}
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
						{/snippet}
					</ListRow>
				{/each}
			</div>
		{/if}
		{#if selection || otherFiles.length}
			<div class="text-lg font-semibold text-secondary-400 mt-8 mb-4">Torrents</div>
		{/if}
		{#if releases.isPending}
			<div class="text-2xl font-medium text-secondary-400 my-8">Searching indexers...</div>
		{:else if releases.error}
			<div class="text-2xl font-medium text-red-400 my-8">{errorMessage(releases.error)}</div>
		{:else}
			<div class="space-y-4">
				{#each otherReleases as release, index (release.id)}
					{@const isOnServer = !!release.infoHash && onServer.has(release.infoHash)}
					<ListRow
						onEnter={scrollIntoView({ vertical: 96 })}
						onClickOrSelect={() => select(release)}
						focusOnMount={index === 0 && !hasFiles && !selection}
					>
						{#snippet children({ hasFocus })}
							<div class="flex-1 min-w-0">
								<div class="text-2xl font-semibold line-clamp-1">{release.title}</div>
								<div class="text-lg font-medium text-secondary-400 mt-1">
									{releaseDetails(release)}
								</div>
							</div>
							<div class="flex-shrink-0 ml-4 text-lg font-medium">
								{#if isOnServer}
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
						{/snippet}
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
