<script lang="ts">
	import { type RadarrRelease } from '../../../apis/radarr/radarr-api';
	import ButtonGhost from '../../Ghosts/ButtonGhost.svelte';
	import type { SonarrRelease } from '../../../apis/sonarr/sonarr-api';
	import MMReleaseListRow from './MMReleaseListRow.svelte';
	import TableHeaderRow from '../../Table/TableHeaderRow.svelte';
	import TableHeaderSortBy from '../../Table/TableHeaderSortBy.svelte';
	import type { GrabReleaseFn } from '../MediaManagerModal';
	import Container from '../../Container.svelte';
	import TableHeaderCell from '../../Table/TableHeaderCell.svelte';
	import MMTitle from '../MMTitle.svelte';

	type Release = RadarrRelease | SonarrRelease;

	export let releases: Promise<Release[]>;
	export let grabRelease: GrabReleaseFn;

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
</script>

<Container trapFocus class="py-8 h-full flex flex-col">
	<h1 class="h1 mx-12">
		<slot name="title" />
	</h1>
	<h2 class="h4 mx-12 mb-8">
		<slot name="subtitle" />
	</h2>

	<div class="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
		{#await releases}
			{#each new Array(5) as _, index}
				<div class="flex-1 my-2">
					<ButtonGhost />
				</div>
			{/each}
		{:then releases}
			<div class="grid grid-cols-[1fr_max-content_max-content_max-content_max-content] gap-y-4">
				<TableHeaderRow>
					<TableHeaderSortBy
						icon={sortBy === 'age' ? sortDirection : undefined}
						on:clickOrSelect={toggleSortBy('age')}>Age</TableHeaderSortBy
					>
					<TableHeaderSortBy
						icon={sortBy === 'size' ? sortDirection : undefined}
						on:clickOrSelect={toggleSortBy('size')}>Size</TableHeaderSortBy
					>
					<TableHeaderSortBy
						icon={sortBy === 'seeders' ? sortDirection : undefined}
						on:clickOrSelect={toggleSortBy('seeders')}>Peers</TableHeaderSortBy
					>
					<TableHeaderSortBy
						icon={sortBy === 'quality' ? sortDirection : undefined}
						on:clickOrSelect={toggleSortBy('quality')}>Quality</TableHeaderSortBy
					>
					<TableHeaderCell />
				</TableHeaderRow>

				<Container class="contents" focusOnMount>
					{#each getRecommendedReleases(releases).sort(getSortFn(sortBy, sortDirection)) as release, index}
						<MMReleaseListRow {release} {grabRelease} />
					{/each}
				</Container>

				<h1 class="text-2xl font-semibold mb-4 mt-8 col-span-5 mx-12">All Releases</h1>

				{#each releases
					.filter((r) => r.guid && r.indexerId)
					.sort(getSortFn(sortBy, sortDirection)) as release, index}
					<MMReleaseListRow {release} {grabRelease} />
				{/each}
			</div>
		{/await}
	</div>
</Container>
