<script lang="ts">
	import type {
		CatalogDownloadDto,
		CatalogTitleOnDiskDto
	} from '$lib/apis/reiverr/reiverr.openapi';
	import Scrollable from '$lib/components/Carousel/Scrollable.svelte';
	import Container from '$lib/components/Container.svelte';
	import LazyImg from '$lib/components/LazyImg.svelte';
	import ListRow from '$lib/components/ListRow.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import QuickNav from '$lib/components/QuickNav.svelte';
	import { navigate } from '$lib/components/StackRouter/stack-router.store';
	import StorageQuota from '$lib/components/StorageQuota.svelte';
	import { TMDB_POSTER_SMALL } from '$lib/constants';
	import { catalogQueries } from '$lib/queries/catalog.queries';
	import { usePageInfiniteQuery, usePageQuery } from '$lib/queries/page-query';
	import { storageQueries } from '$lib/queries/storage.queries';
	import { scrollIntoView } from '$lib/selectable';
	import { formatSize, LETTERS, type Letter } from '$lib/utils';
	import classNames from 'classnames';
	import { ArrowDown, ArrowUp } from 'radix-icons-svelte';
	import { derived, writable } from 'svelte/store';

	type MediaType = CatalogTitleOnDiskDto['mediaType'];
	type Sort = 'size' | 'name' | 'added';
	type Direction = 'asc' | 'desc';
	/** A row of the list: a title with files, or a torrent that is downloading */
	type Title = Pick<CatalogTitleOnDiskDto, 'mediaType' | 'tmdbId' | 'tmdbItem'>;

	const MEDIA_TYPES: { label: string; value: MediaType }[] = [
		{ label: 'Series', value: 'series' },
		{ label: 'Movies', value: 'movie' }
	];
	const SORTS: { label: string; value: Sort }[] = [
		{ label: 'Size', value: 'size' },
		{ label: 'Name', value: 'name' },
		{ label: 'Added', value: 'added' }
	];
	// The direction a sort starts in: largest, A to Z, newest
	const NATURAL: Record<Sort, Direction> = { size: 'desc', name: 'asc', added: 'desc' };

	const mediaType = writable<MediaType | undefined>(undefined);
	// On, the downloads the user's requests wait for and the titles they have files of, sized by what those files take; off, everything the server downloads and has on disk, sized by all of it
	const requestedOnly = writable(true);
	const letter = writable<Letter | null>(null);
	const order = writable<{ sort: Sort; direction: Direction }>({
		sort: 'size',
		direction: NATURAL.size
	});

	const storage = usePageQuery(storageQueries.user());
	const downloads = usePageQuery(
		derived(
			[mediaType, requestedOnly, letter, order],
			([$mediaType, $requestedOnly, $letter, $order]) =>
				catalogQueries.downloads({
					mediaType: $mediaType,
					status: $requestedOnly ? 'requested' : undefined,
					letter: $letter ?? undefined,
					order: $order.sort,
					direction: $order.direction
				})
		)
	);
	const titles = usePageInfiniteQuery(
		derived(
			[mediaType, requestedOnly, letter, order],
			([$mediaType, $requestedOnly, $letter, $order]) =>
				catalogQueries.onDisk({
					mediaType: $mediaType,
					status: $requestedOnly ? 'requested' : undefined,
					letter: $letter ?? undefined,
					order: $order.sort,
					direction: $order.direction
				})
		)
	);
	const { loadMore } = titles;
	$: usage = $storage.data;
	$: downloadList = $downloads.data ?? [];
	$: titleList = $titles.data ?? [];
	$: listed = $requestedOnly ? 'requested' : 'on disk';
	$: error = $downloads.error ?? $titles.error;

	const errorMessage = (e: any): string => e?.response?.data?.message ?? e?.message ?? String(e);

	// Selecting the type that is shown shows both again
	function filter(selected: MediaType) {
		$mediaType = $mediaType === selected ? undefined : selected;
	}

	// Selecting the letter that is on shows every title again
	function filterLetter(index: number) {
		const selected = LETTERS[index] ?? null;
		$letter = $letter === selected ? null : selected;
	}

	// One sort is always on; selecting it again turns it around
	function selectSort(selected: Sort) {
		order.update(({ sort, direction }) =>
			selected === sort
				? { sort, direction: direction === 'asc' ? 'desc' : 'asc' }
				: { sort: selected, direction: NATURAL[selected] }
		);
	}

	const nameOf = (title: Title) =>
		title.tmdbItem.name ?? title.tmdbItem.title ?? `#${title.tmdbId}`;
	const sizeOf = (title: CatalogTitleOnDiskDto, requested: boolean) =>
		requested ? title.heldBytes : title.diskBytes;
	// The user's requests and their rule with the filter on; without it, the files of the title that stay, and those the cleanup deletes
	const retainedOf = ({ files, unretained }: CatalogTitleOnDiskDto) => {
		const retained = files - unretained;
		return `${retained} ${retained === 1 ? 'file' : 'files'}`;
	};
	const detailsOf = (title: CatalogTitleOnDiskDto, requested: boolean) =>
		(requested
			? [
					`${title.fulfilled}/${title.requests} fulfilled`,
					title.rule?.keepNext != null ? `Keep ${title.rule.keepNext} next` : '',
					title.rule?.keepWatched != null ? `Keep last ${title.rule.keepWatched}` : '',
					title.rule?.keepWatchedHours != null ? `Keep for ${title.rule.keepWatchedHours}h` : ''
				]
			: [retainedOf(title), title.unretained ? `${title.unretained} unretained` : '']
		)
			.filter(Boolean)
			.join(' · ');
	// "S01E02", or the season and the number of episodes a torrent downloads; nothing for a movie
	const episodesOf = ({ mediaType, episodes }: CatalogDownloadDto) => {
		const [first] = episodes;
		if (mediaType === 'movie' || !first) return '';
		const pad = (n: number) => String(n).padStart(2, '0');
		if (episodes.length === 1) return `S${pad(first.season)}E${pad(first.episode)}`;
		return episodes.every((episode) => episode.season === first.season)
			? `Season ${first.season} · ${episodes.length} episodes`
			: `${episodes.length} episodes`;
	};
	const downloadDetailsOf = (download: CatalogDownloadDto) =>
		[
			episodesOf(download),
			download.status === 'starting'
				? 'Starting'
				: `${download.peers} ${download.peers === 1 ? 'peer' : 'peers'}`,
			download.downloadSpeed ? `${formatSize(download.downloadSpeed)}/s` : '',
			download.name
		]
			.filter(Boolean)
			.join(' · ');
	const open = (title: Title) => navigate(`/${title.mediaType}/${title.tmdbId}`);
</script>

<Container direction="horizontal" class="h-screen flex" focusOnMount>
	<Container class="flex-1 min-w-0 flex flex-col pt-16 space-y-8 px-32" focusOnMount>
		<div class="divider-lg pb-4 flex items-end justify-between">
			<div class="space-y-2">
				<h1 class="h1">Downloads</h1>
				<p class="body">
					What is downloading, the titles on disk, and what your requests hold of them.
				</p>
			</div>
			{#if usage}
				{#if usage.quotaBytes !== null}
					<StorageQuota
						class="flex-shrink-0 ml-8"
						quotaBytes={usage.quotaBytes}
						usedBytes={usage.heldBytes + usage.pendingBytes}
					/>
				{:else}
					<div class="flex-shrink-0 ml-8 flex items-baseline space-x-4">
						<div class="uppercase text-secondary-200 font-semibold tracking-wider text-lg">
							Storage
						</div>
						<div class="font-semibold text-lg text-secondary-100 tabular-nums">
							{formatSize(usage.heldBytes + usage.pendingBytes)}
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<Scrollable class="flex items-end space-x-8" fadeWidth={3}>
			<div class="flex-shrink-0">
				<div class="uppercase text-secondary-300 font-semibold tracking-wider text-sm mb-2">
					Media Type
				</div>
				<Container direction="horizontal" class="flex space-x-4">
					{#each MEDIA_TYPES as option (option.value)}
						<Pill
							selected={$mediaType === option.value}
							on:clickOrSelect={() => filter(option.value)}
							on:enter={scrollIntoView({ horizontal: 64 })}
						>
							{option.label}
						</Pill>
					{/each}
				</Container>
			</div>
			<div class="flex-shrink-0">
				<div class="uppercase text-secondary-300 font-semibold tracking-wider text-sm mb-2">
					Filter
				</div>
				<Container direction="horizontal" class="flex space-x-4">
					<Pill
						selected={$requestedOnly}
						on:clickOrSelect={() => ($requestedOnly = !$requestedOnly)}
						on:enter={scrollIntoView({ horizontal: 64 })}
					>
						Requested only
					</Pill>
				</Container>
			</div>
			<div class="flex-shrink-0">
				<div class="uppercase text-secondary-300 font-semibold tracking-wider text-sm mb-2">
					Sort By
				</div>
				<Container direction="horizontal" class="flex space-x-4">
					{#each SORTS as option (option.value)}
						<Pill
							selected={$order.sort === option.value}
							on:clickOrSelect={() => selectSort(option.value)}
							on:enter={scrollIntoView({ horizontal: 64 })}
						>
							<span class="flex items-center">
								{option.label}
								{#if $order.sort === option.value}
									<svelte:component
										this={$order.direction === 'desc' ? ArrowDown : ArrowUp}
										size={20}
										class="ml-2"
									/>
								{/if}
							</span>
						</Pill>
					{/each}
				</Container>
			</div>
		</Scrollable>

		{#if downloadList.length || titleList.length}
			<Container
				class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide pb-16 space-y-4"
				style="backface-visibility: hidden;"
			>
				<!-- The sections are titled only while something downloads, as the torrents view titles its -->
				{#if downloadList.length}
					<div class="text-lg font-semibold text-secondary-400">Downloads</div>
				{/if}
				{#each downloadList as download (download.infoHash)}
					<ListRow
						on:enter={scrollIntoView({ vertical: 96 })}
						on:clickOrSelect={() => open(download)}
					>
						<div class="w-12 h-[4.5rem] rounded-lg bg-secondary-800 overflow-hidden flex-shrink-0">
							{#if download.tmdbItem.poster_path}
								<LazyImg
									class="w-full h-full"
									src={TMDB_POSTER_SMALL + download.tmdbItem.poster_path}
									alt=""
								/>
							{/if}
						</div>
						<div class="flex-1 min-w-0 ml-6">
							<div class="text-2xl font-semibold line-clamp-1">{nameOf(download)}</div>
							<div class="text-lg font-medium text-secondary-400 mt-1 line-clamp-1">
								{downloadDetailsOf(download)}
							</div>
						</div>
						<div class="flex-shrink-0 ml-4 w-48">
							<div class="text-lg font-medium text-secondary-300 tabular-nums text-right">
								{Math.floor(download.progress * 100)}% of {formatSize(download.size)}
							</div>
							<ProgressBar progress={download.progress} />
						</div>
					</ListRow>
				{/each}
				{#if downloadList.length && titleList.length}
					<div class="text-lg font-semibold text-secondary-400 mt-8">On disk</div>
				{/if}
				{#each titleList as title (`${title.mediaType}-${title.tmdbId}`)}
					<ListRow on:enter={scrollIntoView({ vertical: 96 })} on:clickOrSelect={() => open(title)}>
						<div class="w-12 h-[4.5rem] rounded-lg bg-secondary-800 overflow-hidden flex-shrink-0">
							{#if title.tmdbItem.poster_path}
								<LazyImg
									class="w-full h-full"
									src={TMDB_POSTER_SMALL + title.tmdbItem.poster_path}
									alt=""
								/>
							{/if}
						</div>
						<div class="flex-1 min-w-0 ml-6">
							<div class="text-2xl font-semibold line-clamp-1">{nameOf(title)}</div>
							<div class="text-lg font-medium text-secondary-400 mt-1 line-clamp-1">
								{detailsOf(title, $requestedOnly)}
							</div>
						</div>
						<div class="flex-shrink-0 ml-4 text-lg font-medium text-secondary-300 tabular-nums">
							{formatSize(sizeOf(title, $requestedOnly))}
						</div>
					</ListRow>
				{/each}
				<!-- Reaches up from the end of the rows, so that more are there before the last one is -->
				<div class="relative">
					<div use:loadMore class="absolute bottom-0 w-px h-[50rem] pointer-events-none" />
				</div>
			</Container>
		{:else}
			<div class={classNames('h-ghost', { error: !!error })}>
				{#if error}
					{errorMessage(error)}
				{:else if $downloads.isLoading || $titles.isLoading}
					Loading...
				{:else if $letter}
					Nothing {listed} under {$letter}.
				{:else if $mediaType}
					No {$mediaType === 'movie' ? 'movies' : 'series'} {listed}.
				{:else}
					Nothing {listed} yet.
				{/if}
			</div>
		{/if}
	</Container>
	<QuickNav
		size="sm"
		class="fixed right-12 inset-y-0 justify-center z-10"
		items={LETTERS}
		selected={$letter ? LETTERS.indexOf($letter) : -1}
		on:select={({ detail }) => filterLetter(detail)}
	/>
</Container>
