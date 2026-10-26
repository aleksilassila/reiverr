<script lang="ts">
	import type { EpisodeRefDto, RequestRuleDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Container from '$lib/components/Container.svelte';
	import FloatingIconButton from '$lib/components/FloatingIconButton.svelte';
	import SelectDialog from '$lib/components/Dialog/SelectDialog.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import { createErrorNotification } from '$lib/components/Notifications/notification.store';
	import QuickNav from '$lib/components/QuickNav.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import StorageQuota from '$lib/components/StorageQuota.svelte';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { PLATFORM_TV, TMDB_BACKDROP_SMALLEST } from '$lib/constants';
	import { usePageQuery } from '$lib/queries/page-query';
	import {
		episodeKey,
		seriesQueries,
		setSeriesRequests,
		updateSeriesRequestRule
	} from '$lib/queries/series.queries';
	import { storageQueries } from '$lib/queries/storage.queries';
	import { confirmQuota, expectedBytes } from '$lib/quota';
	import classNames from 'classnames';
	import { ChevronDown, Cross1 } from 'radix-icons-svelte';
	import HeroTitleInfo from '../HeroTitleInfo.svelte';
	import SeasonItem from './SeasonItem.svelte';
	import TorrentsView from './TorrentsView.svelte';

	export let tmdbId: string;

	/** Download progress and usage change without the user doing anything */
	const REFRESH_INTERVAL = 5000;

	type RuleField = {
		key: keyof RequestRuleDto;
		name: string;
		description: string;
		options: { label: string; value: number | null }[];
	};

	const WATCHED_DESCRIPTION =
		'Choose how past watched episodes are kept. With both limits set, either one keeps a request.';
	const RULE_FIELDS: RuleField[] = [
		{
			key: 'keepNext',
			name: 'Download ahead',
			description: 'Choose how many unwatched episodes ahead are downloaded.',
			options: [
				{ label: 'All requested', value: null },
				{ label: 'Next episode', value: 1 },
				{ label: 'Next 2 episodes', value: 2 },
				{ label: 'Next 3 episodes', value: 3 }
			]
		},
		{
			key: 'keepWatched',
			name: 'Keep last watched',
			description: WATCHED_DESCRIPTION,
			options: [
				{ label: 'Off', value: null },
				{ label: '1 episode', value: 1 },
				{ label: '2 episodes', value: 2 },
				{ label: '3 episodes', value: 3 }
			]
		},
		{
			key: 'keepWatchedHours',
			name: 'Keep watched for',
			description: WATCHED_DESCRIPTION,
			options: [
				{ label: 'Off', value: null },
				{ label: '1 day', value: 24 },
				{ label: '1 week', value: 24 * 7 },
				{ label: '1 month', value: 24 * 30 }
			]
		}
	];

	const componentStack = useComponentStack();
	const { background } = backgroundContext.getContext();
	const tmdbSeries = usePageQuery(seriesQueries.metadata(tmdbId));
	const status = usePageQuery({
		...seriesQueries.status(tmdbId),
		refetchInterval: REFRESH_INTERVAL
	});
	const rule = usePageQuery(seriesQueries.rule(tmdbId));
	const storage = usePageQuery({ ...storageQueries.user(), refetchInterval: REFRESH_INTERVAL });
	$: requests = $status.data;
	$: ruleData = $rule.data;
	$: usage = $storage.data;

	const seasonItems: SeasonItem[] = [];
	// The season of the focused row, highlighted in the quick navigation
	let activeSeason: number | undefined = undefined;
	$: seasons = $tmdbSeries.data?.seasons ?? [];
	$: selectedSeason = Math.max(
		0,
		seasons.findIndex((season) => season.season_number === activeSeason)
	);

	const getLabel = (field: RuleField, rule?: RequestRuleDto) =>
		field.options.find((option) => option.value === (rule?.[field.key] ?? null))?.label ?? '';

	function selectRuleOption(field: RuleField) {
		const current = ruleData;
		if (!current) return;

		componentStack.push({
			component: SelectDialog,
			props: {
				title: field.name,
				subtitle: field.description,
				options: field.options.map((option) => option.label),
				selectedOption: getLabel(field, current),
				handleSelectOption: (label: string) =>
					updateSeriesRequestRule(tmdbId, {
						...current,
						[field.key]: field.options.find((option) => option.label === label)?.value ?? null
					}).catch((e) =>
						createErrorNotification(
							'Could not update the setting',
							e?.response?.data?.message ?? e?.message
						)
					)
			}
		});
	}

	/** What a new request of the episode is expected to take from its source, if it has one */
	function sourceBytes({ season, episode }: EpisodeRefDto): number {
		const own = requests?.preferences.get(episodeKey(season, episode));
		if (own?.torrent) return own.torrent.size;
		if (own?.file) return own.file.size ?? 0;

		const pack = requests?.preferences.get(episodeKey(season, 0))?.torrent;
		const episodesInSeason = seasons.find((s) => s.season_number === season)?.episodes?.length;
		return pack ? expectedBytes(pack.size, false, episodesInSeason) : 0;
	}

	async function request(episodes: EpisodeRefDto[], requested: boolean) {
		const bytes = !requested
			? 0
			: episodes
					.filter((e) => !requests?.episodes.get(episodeKey(e.season, e.episode))?.requested)
					.reduce((sum, e) => sum + sourceBytes(e), 0);
		if (!(await confirmQuota(bytes))) return;

		await setSeriesRequests(tmdbId, episodes, requested);
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
	direction="horizontal"
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
	<QuickNav
		class="absolute left-12 inset-y-0 justify-center"
		items={seasons.map((season) => `S${season.season_number}`)}
		selected={selectedSeason}
		on:select={({ detail }) => seasonItems[detail]?.focus()}
	/>
	<Container class="flex-1 min-h-0 flex flex-col">
		<div class="mx-32 mt-16">
			<div class="flex justify-between items-end">
				<div class="min-w-0">
					<HeroTitleInfo
						overview=""
						properties={[{ label: 'Select to request' }, { label: 'Right to choose a torrent' }]}
					>
						<span slot="title" class="block truncate leading-tight">
							{$tmdbSeries.data?.name ?? ''}
						</span>
					</HeroTitleInfo>
				</div>
				{#if usage && usage.quotaBytes !== null}
					<StorageQuota
						class="flex-shrink-0 ml-8"
						quotaBytes={usage.quotaBytes}
						usedBytes={usage.heldBytes + usage.pendingBytes}
					/>
				{/if}
			</div>

			<Container direction="horizontal" class="flex space-x-4 mt-6">
				{#each RULE_FIELDS as field (field.key)}
					<SelectField
						class="flex-1"
						value={getLabel(field, ruleData)}
						disabled={!ruleData}
						on:clickOrSelect={() => selectRuleOption(field)}
						type="transparent"
					>
						{field.name}
						<ChevronDown slot="icon" let:size let:iconClass {size} class={classNames(iconClass)} />
					</SelectField>
				{/each}
			</Container>

			<div class="divider mt-4" />
		</div>

		<Container
			focusOnMount
			class="overflow-y-auto overflow-x-hidden scrollbar-hide pb-16 mx-32"
			style="backface-visibility: hidden"
		>
			{#each seasons as season, index (season.season_number)}
				{#if index > 0}
					<div class="divider mt-8" />
				{/if}
				<SeasonItem
					bind:this={seasonItems[index]}
					on:enter={() => (activeSeason = season.season_number)}
					{season}
					{requests}
					on:request={({ detail }) =>
						request(detail.episodes, detail.requested).catch((e) =>
							createErrorNotification(
								'Could not update the request',
								e?.response?.data?.message ?? e?.message
							)
						)}
					on:torrents={({ detail }) =>
						componentStack.push({ component: TorrentsView, props: { tmdbId, ...detail } })}
				/>
			{:else}
				<div class="h-ghost m-auto">
					{#if $tmdbSeries.isPending}
						Loading...
					{:else}
						Could not load series.
					{/if}
				</div>
			{/each}
		</Container>
	</Container>
</Container>
