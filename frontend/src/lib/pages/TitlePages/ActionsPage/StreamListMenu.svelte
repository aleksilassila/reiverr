<script lang="ts">
	import type {
		ListWithDetailsItemDto,
		MediaSourceDto,
		ProviderWithStreamsDto
	} from '$lib/apis/reiverr/reiverr.openapi';
	import type { TmdbEpisode, TmdbSeries } from '$lib/apis/tmdb/tmdb-api';
	import ComponentStackContainer from '$lib/components/ComponentStack/ComponentStackContainer.svelte';
	import Container from '$lib/components/Container.svelte';
	import { getBackgroundPage } from '$lib/components/GlobalBackground/BackgroundStack';
	import { TMDB_BACKDROP_SMALLEST } from '$lib/constants';
	import { scrollIntoView } from '$lib/selectable';
	import { capitalize, toNonNullable } from '$lib/utils';
	import classNames from 'classnames';
	import { breadcrumbsContext, playableDataContext, titlePageContext } from './actions-page';

	type Row = ListWithDetailsItemDto;
	type Items = {
		source: MediaSourceDto;
		streams: Row[];
	};

	export let items: ProviderWithStreamsDto[];
	export let series: TmdbSeries;
	export let episode: TmdbEpisode;
	// export let tmdbId: string;
	// export let season: number;
	// export let episode: number;

	const background = getBackgroundPage();

	// const {} = playableDataContext.createContext({ tmdbId, season, episode });
	const { playStream } = playableDataContext.createContext({
		tmdbId: `${series.id}`,
		season: episode.season_number ?? 0,
		episode: episode.episode_number ?? 0
	});

	const { componentStack } = titlePageContext.getContext();
	const { breadcrumbs } = breadcrumbsContext.createContext('asd');

	function handleClickItem({ item, source }: { item: Row; source: MediaSourceDto }) {}
	function handleShowAll({ source }: { source: MediaSourceDto }) {}

	let selectedProvider: ProviderWithStreamsDto | undefined = items[0];
</script>

<!-- <TheListContainer
	items={items.map((i) => ({
		...i,
		source: i.provider,
		streams: i.streams.map((s) => ({
			...s,
			id: s.streamId,
			label: s.title,
			description: '',
			properties: [],
			actions: []
		}))
	}))}
	{handleClickItem}
	{handleShowAll}
/> -->

<div class="fixed inset-0 scale-110 z-[21]">
	<div
		class="absolute inset-0 bg-center bg-cover bg-no-repeat blur-md brightness-[0.2] saturate-50"
		style={$background?.backdropUri
			? `background-image: url('${TMDB_BACKDROP_SMALLEST}${$background?.backdropUri}');`
			: ''}
	/>
</div>

<ComponentStackContainer trapFocus hideSidebar>
	<Container
		class={classNames('px-32 flex flex-col h-screen bg-primary-900/50', $$restProps.class)}
		on:back={({ detail }) => {
			componentStack.pop();
			detail.stopPropagation();
		}}
	>
		<Container class="flex items-center max-w-screen py-4" direction="horizontal">
			<div
				class="*:text-ellipsis *:text-nowrap *:overflow-hidden overflow-hidden flex-grow flex-shrink"
			>
				<p class="body">
					{series.name}
					{`S${episode.season_number}`} E{episode.episode_number}
				</p>
				<h2 class="h2">
					{episode.name}
				</h2>
			</div>
			{#each items as provider}
				<Container
					on:clickOrSelect={() => (selectedProvider = provider)}
					class="mx-4 cursor-pointer flex-shrink-0 h3"
					let:hasFocus
				>
					<span
						class={classNames({ 'text-secondary-100': hasFocus, 'text-secondary-500': !hasFocus })}
					>
						{provider.provider.name} ({provider.streams.length})
					</span>
				</Container>
			{/each}
		</Container>

		<Container
			class="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide"
			style="backface-visibility: hidden"
			focusOnMount
		>
			{#each selectedProvider?.streams ?? [] as row, index}
				<Container
					on:enter={scrollIntoView({ top: 32 })}
					focusOnClick
					let:hasFocus
					on:clickOrSelect={() =>
						playStream({
							source: toNonNullable(selectedProvider).provider,
							streamId: row.streamId
						})}
				>
					<div class={classNames('cursor-pointer my-8 rounded-xl', {})}>
						<span
							class={classNames(
								'text-3xl font-semibold flex items-center',
								// 'text-secondary-200',
								{
									'text-secondary-500': !hasFocus,
									'text-secondary-100': hasFocus
								}
							)}
						>
							<span class="line-clamp-1">
								{capitalize(row.title)}
							</span>
							<!-- {#if hasFocus}
								<Play class="w-8 h-8 ml-4" />
							{/if} -->
						</span>
						<span class="text-secondary-200">
							{row.properties?.map((p) => `${p.label}: ${p.formatted || p.value}`).join(', ')}
						</span>
					</div>
				</Container>

				<!-- <div class="h-[1px] w-full my-2 bg-secondary-400" /> -->
			{:else}
				<div class="h-ghost m-auto">No streams available</div>
			{/each}
		</Container>
	</Container>
</ComponentStackContainer>
