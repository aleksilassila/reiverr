<script lang="ts">
	import { type RadarrRelease } from '../../../apis/radarr/radarr-api';
	import ButtonGhost from '../../Ghosts/ButtonGhost.svelte';
	import type { SonarrEpisode, SonarrRelease, SonarrSeries } from '../../../apis/sonarr/sonarr-api';
	import MMReleaseListRow from './MMReleaseListRow.svelte';
	import type { GrabReleaseFn } from '../MediaManagerModal';
	import Container from '../../../../Container.svelte';
	import Dropdown from '../../Dropdown.svelte';
	import { scrollElementIntoView, type Selectable } from '../../../selectable';
	import Button from '../../Button.svelte';
	import { formatMinutesToTime, formatSize } from '../../../utils';
	import { Check, Download, Play, Reload } from 'radix-icons-svelte';
	import FadedScrollContainer from '../../FadedScrollContainer.svelte';
	import { capitalize } from '../../../utils.js';
	import { playerState } from '../../VideoPlayer/VideoPlayer';
	import { notificationStack } from '../../Notifications/notification.store';
	import IconButton from '../../IconButton.svelte';

	type Release = RadarrRelease | SonarrRelease;

	const sortByOptions = [
		{ value: 'size', text: 'Sort by Size' },
		{ value: 'quality', text: 'Sort by Quality' },
		{ value: 'seeders', text: 'Sort by Peers' },
		{ value: 'age', text: 'Sort by Age' }
	];

	const sortDirectionOptions = [
		{ value: 'asc', text: 'Ascending' },
		{ value: 'desc', text: 'Descending' }
	];

	export let tmdbId: number | undefined = undefined;
	export let sonarrItem: SonarrSeries | SonarrEpisode;
	export let releases: Promise<Release[]>;
	export let grabRelease: GrabReleaseFn;

	let selectedRelease: Release | undefined;
	let details: Selectable | undefined;

	let sortBy: 'size' | 'quality' | 'seeders' | 'age' | undefined = 'seeders';
	let sortDirection: 'asc' | 'desc' = 'desc';

	function getRecommendedReleases(releases: Release[]) {
		if (!releases) return [];
		let filtered = releases.slice();

		const releaseIsEnough = (r: Release) => r?.quality?.quality?.resolution || 0 > 720;
		filtered.sort((a, b) => (b.seeders || 0) - (a.seeders || 0));
		filtered.sort((a, b) => (releaseIsEnough(b) ? 1 : 0) - (releaseIsEnough(a) ? 1 : 0));
		filtered = filtered.slice(0, 5);

		filtered.sort((a, b) => (b.size || 0) - (a.size || 0));

		return filtered;
	}

	const toggleSortBy = (sort: typeof sortBy) => () => {
		if (sortBy === sort) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = sort;
			sortDirection = 'desc';
		}
	};

	function getSortFn(sb: typeof sortBy, sd: typeof sortDirection) {
		return (a: Release, b: Release) => {
			if (sb === 'size') {
				return (sd === 'asc' ? 1 : -1) * ((a.size || 0) - (b.size || 0));
			}
			if (sb === 'quality') {
				return (
					(sd === 'asc' ? 1 : -1) *
					((a.quality?.quality?.resolution || 0) - (b.quality?.quality?.resolution || 0))
				);
			}
			if (sb === 'seeders') {
				return (sd === 'asc' ? 1 : -1) * ((a.seeders || 0) - (b.seeders || 0));
			}
			if (sb === 'age') {
				return (sd === 'asc' ? 1 : -1) * ((b.ageHours || 0) - (a.ageHours || 0));
			}
			return 0;
		};
	}

	let fetching = false;
	let didGrab = false;

	function handleGrabRelease(release: Release) {
		fetching = true;
		grabRelease(release).then((ok) => {
			fetching = false;
			didGrab = ok;
			if (!ok)
				notificationStack.createDefault({
					title: 'Failed to grab release',
					body: `Could not grab ${release.title}`,
					type: 'error'
				});
			else
				notificationStack.createDefault({
					title: 'Release grabbed',
					body: `Successfully grabbed ${release.title}`
				});
		});
	}

	function handleStreamRelease(release: Release) {
		let seasonNumber, episodeNumber;

		if ('episodeNumber' in sonarrItem) {
			seasonNumber = sonarrItem.seasonNumber;
			episodeNumber = sonarrItem.episodeNumber;
		}

		release.magnetUrl &&
			playerState.streamMagnetLink(release.magnetUrl, tmdbId, seasonNumber, episodeNumber);
	}
</script>

<Container trapFocus class="h-full flex flex-col">
	<div class="flex mx-12 mb-16">
		<div class="flex-1 space-y-1">
			<h1 class="header4">
				<slot name="title" />
			</h1>
			<h2 class="body">
				<slot name="subtitle" />
			</h2>
		</div>
		<Container direction="horizontal" class="flex space-x-4 items-center">
			<Dropdown bind:value={sortBy} options={sortByOptions} />
			<Dropdown bind:value={sortDirection} options={sortDirectionOptions} />
			<IconButton icon={Reload} type="secondary" size="sm">Refresh</IconButton>
		</Container>
	</div>

	<Container direction="horizontal" class="flex-1 min-h-0 flex space-x-16">
		{#await releases}
			{#each new Array(5) as _, index}
				<div class="flex-1 my-2">
					<ButtonGhost />
				</div>
			{/each}
		{:then releases}
			<FadedScrollContainer
				class="flex-1 grid grid-cols-[1fr_max-content_max-content] gap-y-8 pb-16"
			>
				<Container class="contents">
					<h1 class="header1 pl-12 py-2 border-b-2 border-secondary-200/20 self-end">
						Recommended
					</h1>
					<div
						class="font-medium text-secondary-200 py-2 border-b-2 border-secondary-200/20 self-end pl-4"
					>
						Quality
					</div>
					<div
						class="font-medium text-secondary-200 py-2 border-b-2 border-secondary-200/20 self-end pl-4 pr-12"
					>
						Peers
					</div>
					<!--				<TableHeaderRow>-->
					<!--					<TableHeaderSortBy-->
					<!--						icon={sortBy === 'age' ? sortDirection : undefined}-->
					<!--						on:clickOrSelect={toggleSortBy('age')}>Age</TableHeaderSortBy-->
					<!--					>-->
					<!--					<TableHeaderSortBy-->
					<!--						icon={sortBy === 'size' ? sortDirection : undefined}-->
					<!--						on:clickOrSelect={toggleSortBy('size')}>Size</TableHeaderSortBy-->
					<!--					>-->
					<!--					&lt;!&ndash;					<TableHeaderSortBy&ndash;&gt;-->
					<!--					&lt;!&ndash;						icon={sortBy === 'seeders' ? sortDirection : undefined}&ndash;&gt;-->
					<!--					&lt;!&ndash;						on:clickOrSelect={toggleSortBy('seeders')}>Peers</TableHeaderSortBy&ndash;&gt;-->
					<!--					&lt;!&ndash;					>&ndash;&gt;-->
					<!--					&lt;!&ndash;					<TableHeaderSortBy&ndash;&gt;-->
					<!--					&lt;!&ndash;						icon={sortBy === 'quality' ? sortDirection : undefined}&ndash;&gt;-->
					<!--					&lt;!&ndash;						on:clickOrSelect={toggleSortBy('quality')}>Quality</TableHeaderSortBy&ndash;&gt;-->
					<!--					&lt;!&ndash;					>&ndash;&gt;-->
					<!--					&lt;!&ndash;					<TableHeaderCell />&ndash;&gt;-->
					<!--				</TableHeaderRow>-->

					<Container class="contents" focusOnMount>
						{#each getRecommendedReleases(releases).sort(getSortFn(sortBy, sortDirection)) as release, index}
							<MMReleaseListRow
								{release}
								{grabRelease}
								on:enter={(e) => {
									selectedRelease = release;
									const el = e.detail.selectable.getHtmlElement()?.children?.[0];
									// @ts-ignore
									if (el) scrollElementIntoView(el, { vertical: 128 });
								}}
								on:clickOrSelect={() => {
									selectedRelease = release;
									details?.focus();
								}}
							/>
						{/each}
					</Container>

					<h1 class="header1 pl-12 py-2 border-b-2 border-secondary-200/20 self-end mt-8">
						All Releases
					</h1>
					<div
						class="font-medium text-secondary-200 py-2 border-b-2 border-secondary-200/20 self-end pl-4"
					>
						Quality
					</div>
					<div
						class="font-medium text-secondary-200 py-2 border-b-2 border-secondary-200/20 self-end pl-4 pr-12"
					>
						Peers
					</div>

					{#each releases
						.filter((r) => r.guid && r.indexerId)
						.sort(getSortFn(sortBy, sortDirection)) as release, index}
						<MMReleaseListRow
							{release}
							{grabRelease}
							on:enter={(e) => {
								selectedRelease = release;
								const el = e.detail.selectable.getHtmlElement()?.children?.[0];
								// @ts-ignore
								if (el) scrollElementIntoView(el, { vertical: 128 });
							}}
							on:clickOrSelect={() => {
								selectedRelease = release;
								details?.focus();
							}}
						/>
					{/each}
				</Container>
			</FadedScrollContainer>
			<div class="flex-1 max-w-xl pr-12">
				{#if selectedRelease}
					<Container bind:selectable={details} class="flex-1 space-y-8">
						<div>
							<h1 class="header2 break-all">{selectedRelease.title}</h1>
							<h2 class="body">
								{selectedRelease.indexer}
							</h2>
						</div>

						<div class="divide-y divide-secondary-200/20">
							<div class="flex items-center space-x-4 py-4 font-medium justify-between">
								<h1 class="text-secondary-300">Quality</h1>
								<div class="text-secondary-100">{selectedRelease.quality?.quality?.name}</div>
							</div>
							<div class="flex items-center space-x-4 py-4 font-medium justify-between">
								<h1 class="text-secondary-300">Size</h1>
								<div class="text-secondary-100">{formatSize(selectedRelease.size || 0)}</div>
							</div>
							<div class="flex items-center space-x-4 py-4 font-medium justify-between">
								<h1 class="text-secondary-300">Peers / Leeches</h1>
								<div class="text-secondary-100">
									{selectedRelease.seeders} / {selectedRelease.leechers}
								</div>
							</div>
							<div class="flex items-center space-x-4 py-4 font-medium justify-between">
								<h1 class="text-secondary-300">Languages</h1>
								<div class="text-secondary-100">
									{selectedRelease.languages?.map((l) => l.name).join()}
								</div>
							</div>
							<div class="flex items-center space-x-4 py-4 font-medium justify-between">
								<h1 class="text-secondary-300">Protocol</h1>
								<div class="text-secondary-100">{capitalize(selectedRelease.protocol || '')}</div>
							</div>
							<div class="flex items-center space-x-4 py-4 font-medium justify-between">
								<h1 class="text-secondary-300">Release Weight</h1>
								<div class="text-secondary-100">{selectedRelease.releaseWeight}</div>
							</div>
							<div class="flex items-center space-x-4 py-4 font-medium justify-between">
								<h1 class="text-secondary-300">Date</h1>
								<div class="text-secondary-100">
									{new Date(selectedRelease.publishDate || 0).toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}

									({formatMinutesToTime(selectedRelease.ageMinutes || 0)}
									old)
								</div>
							</div>
							{#if selectedRelease.rejections?.length}
								<div class="flex items-center space-x-4 py-4 font-medium justify-between">
									<h1 class="text-secondary-300">Reject Reason</h1>
									<div class="text-secondary-100">{selectedRelease.rejections?.join()}</div>
								</div>
							{/if}
						</div>

						<Container direction="horizontal" class="flex space-x-4">
							<Button
								icon={Play}
								on:clickOrSelect={() => selectedRelease && handleStreamRelease(selectedRelease)}
							>
								Stream
							</Button>
							<Button
								icon={didGrab ? Check : Download}
								on:clickOrSelect={() => selectedRelease && handleGrabRelease(selectedRelease)}
								disabled={didGrab || fetching}
							>
								Download
							</Button>
						</Container>
					</Container>
				{/if}
			</div>
		{/await}
	</Container>
</Container>
