<script lang="ts">
	import type { TitleUsageDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Scrollable from '$lib/components/Carousel/Scrollable.svelte';
	import Container from '$lib/components/Container.svelte';
	import LazyImg from '$lib/components/LazyImg.svelte';
	import ListRow from '$lib/components/ListRow.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import QuickNav from '$lib/components/QuickNav.svelte';
	import { navigate } from '$lib/components/StackRouter/stack-router.store';
	import StorageQuota from '$lib/components/StorageQuota.svelte';
	import { TMDB_POSTER_SMALL } from '$lib/constants';
	import { scrollIntoView } from '$lib/selectable';
	import { useData, usePaginatedData } from '$lib/stores/data/data.store';
	import { reiverrApi, user } from '$lib/stores/user.store';
	import { formatSize, LETTERS, type Letter } from '$lib/utils';
	import classNames from 'classnames';
	import { ArrowDown, ArrowUp } from 'radix-icons-svelte';

	const PAGE_SIZE = 50;

	type MediaType = TitleUsageDto['mediaType'];
	type Sort = 'size' | 'name' | 'fulfilled';
	type Direction = 'asc' | 'desc';

	const MEDIA_TYPES: { label: string; value: MediaType }[] = [
		{ label: 'Series', value: 'series' },
		{ label: 'Movies', value: 'movie' }
	];
	const SORTS: { label: string; value: Sort }[] = [
		{ label: 'Size', value: 'size' },
		{ label: 'Name', value: 'name' },
		{ label: 'Available', value: 'fulfilled' }
	];
	// The direction a sort starts in: largest, A to Z, newest
	const NATURAL: Record<Sort, Direction> = { size: 'desc', name: 'asc', fulfilled: 'desc' };

	let error = '';
	let mediaType: MediaType | undefined = undefined;
	let letter: Letter | null = null;
	let sort: Sort = 'size';
	let direction: Direction = NATURAL[sort];

	const storage = useData(() =>
		reiverrApi.library.getUserStorage($user?.id as string).then((r) => r.data)
	);
	const storageData = storage.data;
	const { observer, loading, reset, ...titles } = usePaginatedData((page) =>
		reiverrApi.library
			.getUserTitles($user?.id as string, {
				page,
				itemsPerPage: PAGE_SIZE,
				mediaType,
				letter: letter ?? undefined,
				sort,
				direction
			})
			.then((r) => r.data.items)
			.catch((e) => {
				error = e?.response?.data?.message ?? e?.message ?? String(e);
				return [];
			})
	);

	// Selecting the type that is shown shows both again
	function filter(selected: MediaType) {
		mediaType = mediaType === selected ? undefined : selected;
		error = '';
		reset();
	}

	// Selecting the letter that is on shows every title again
	function filterLetter(index: number) {
		const selected = LETTERS[index] ?? null;
		letter = letter === selected ? null : selected;
		error = '';
		reset();
	}

	// One sort is always on; selecting it again turns it around
	function selectSort(selected: Sort) {
		if (selected === sort) {
			direction = direction === 'asc' ? 'desc' : 'asc';
		} else {
			sort = selected;
			direction = NATURAL[selected];
		}
		error = '';
		reset();
	}

	const nameOf = (title: TitleUsageDto) =>
		title.tmdbItem.name ?? title.tmdbItem.title ?? `#${title.tmdbId}`;
	const detailsOf = (title: TitleUsageDto) =>
		[
			`${title.withFile}/${title.requests} available`,
			title.downloading ? `${title.downloading} downloading` : '',
			title.rule?.keepNext != null ? `Keep ${title.rule.keepNext} next` : '',
			title.rule?.keepWatched != null ? `Keep last ${title.rule.keepWatched}` : '',
			title.rule?.keepWatchedHours != null ? `Keep for ${title.rule.keepWatchedHours}h` : ''
		]
			.filter(Boolean)
			.join(' · ');
	const open = (title: TitleUsageDto) => navigate(`/${title.mediaType}/${title.tmdbId}`);
</script>

<Container direction="horizontal" class="h-screen flex" focusOnMount>
	<Container class="flex-1 min-w-0 flex flex-col pt-16 space-y-8 px-32" focusOnMount>
		<div class="divider-lg pb-4 flex items-end justify-between">
			<div class="space-y-2">
				<h1 class="h1">Requests</h1>
				<p class="body">Your quota and the titles you have requests for.</p>
			</div>
			{#if $storageData}
				{#if $storageData.quotaBytes !== null}
					<StorageQuota
						class="flex-shrink-0 ml-8"
						quotaBytes={$storageData.quotaBytes}
						usedBytes={$storageData.heldBytes + $storageData.pendingBytes}
					/>
				{:else}
					<div class="flex-shrink-0 ml-8 flex items-baseline space-x-4">
						<div class="uppercase text-secondary-200 font-semibold tracking-wider text-lg">
							Storage
						</div>
						<div class="font-semibold text-lg text-secondary-100 tabular-nums">
							{formatSize($storageData.heldBytes + $storageData.pendingBytes)}
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
							selected={mediaType === option.value}
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
					Sort By
				</div>
				<Container direction="horizontal" class="flex space-x-4">
					{#each SORTS as option (option.value)}
						<Pill
							selected={sort === option.value}
							on:clickOrSelect={() => selectSort(option.value)}
							on:enter={scrollIntoView({ horizontal: 64 })}
						>
							<span class="flex items-center">
								{option.label}
								{#if sort === option.value}
									<svelte:component
										this={direction === 'desc' ? ArrowDown : ArrowUp}
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

		{#if $titles.length}
			<Container
				class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide pb-16 space-y-4"
				style="backface-visibility: hidden;"
			>
				{#each $titles as title (`${title.mediaType}-${title.tmdbId}`)}
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
								{detailsOf(title)}
							</div>
						</div>
						<div class="flex-shrink-0 ml-4 text-lg font-medium text-secondary-300 tabular-nums">
							{formatSize(title.heldBytes + title.pendingBytes)}
						</div>
					</ListRow>
				{/each}
				<!-- Reaches up from the end of the rows, so that more are there before the last one is -->
				<div class="relative">
					<div use:observer class="absolute bottom-0 w-px h-[50rem] pointer-events-none" />
				</div>
			</Container>
		{:else}
			<div class={classNames('h-ghost', { error: !!error })}>
				{#if error}
					{error}
				{:else if $loading}
					Loading...
				{:else if letter}
					Nothing requested under {letter}.
				{:else if mediaType}
					No {mediaType === 'movie' ? 'movies' : 'series'} requested.
				{:else}
					Nothing requested yet.
				{/if}
			</div>
		{/if}
	</Container>
	<QuickNav
		size="sm"
		class="fixed right-12 inset-y-0 justify-center z-10"
		items={LETTERS}
		selected={letter ? LETTERS.indexOf(letter) : -1}
		on:select={({ detail }) => filterLetter(detail)}
	/>
</Container>
