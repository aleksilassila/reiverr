<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import FloatingIconButton from '$lib/components/FloatingIconButton.svelte';
	import SelectDialog from '$lib/components/Dialog/SelectDialog.svelte';
	import { backgroundContext } from '$lib/components/GlobalBackground/background-stack.store';
	import { createErrorNotification } from '$lib/components/Notifications/notification.store';
	import SelectField from '$lib/components/SelectField.svelte';
	import StorageQuota from '$lib/components/StorageQuota.svelte';
	import { useComponentStack } from '$lib/components/StackRouter/stack-router.store';
	import { PLATFORM_TV, TMDB_BACKDROP_SMALLEST } from '$lib/constants';
	import {
		movieQueries,
		setMovieRequested,
		updateMovieRequestRule
	} from '$lib/queries/movie.queries';
	import { usePageQuery } from '$lib/queries/page-query';
	import { getStatusLabel, isErrorStatus } from '$lib/queries/request-status';
	import { storageQueries } from '$lib/queries/storage.queries';
	import { confirmQuota } from '$lib/quota';
	import classNames from 'classnames';
	import { ChevronDown, Cross1 } from 'radix-icons-svelte';
	import HeroTitleInfo from '../HeroTitleInfo.svelte';
	import RequestRow from '../SeriesPage/RequestRow.svelte';
	import TorrentsView from './TorrentsView.svelte';

	export let tmdbId: string;

	/** Download progress and usage change without the user doing anything */
	const REFRESH_INTERVAL = 5000;

	// The one setting of a movie: download ahead and keep last watched are for episodes
	const KEEP_FIELD = {
		name: 'Keep watched for',
		description: 'Choose how long the movie is kept after it was watched.',
		options: [
			{ label: 'Off', value: null },
			{ label: '1 day', value: 24 },
			{ label: '1 week', value: 24 * 7 },
			{ label: '1 month', value: 24 * 30 }
		] as { label: string; value: number | null }[]
	};

	const componentStack = useComponentStack();
	const { background } = backgroundContext.getContext();
	const tmdbMovie = usePageQuery(movieQueries.metadata(tmdbId));
	const statusQuery = usePageQuery({
		...movieQueries.status(tmdbId),
		refetchInterval: REFRESH_INTERVAL
	});
	const rule = usePageQuery(movieQueries.rule(tmdbId));
	const storage = usePageQuery({ ...storageQueries.user(), refetchInterval: REFRESH_INTERVAL });
	$: movie = $tmdbMovie.data;
	$: status = $statusQuery.data;
	$: ruleData = $rule.data;
	$: usage = $storage.data;

	$: name = movie ? `${movie.title} (${new Date(movie.release_date ?? 0).getFullYear()})` : '';
	$: keepLabel =
		KEEP_FIELD.options.find((option) => option.value === (ruleData?.keepWatchedHours ?? null))
			?.label ?? '';
	$: source = status?.preference;
	$: sourceTitle = source?.torrent?.title ?? source?.file?.fileName;

	function selectKeepOption() {
		if (!ruleData) return;

		componentStack.push({
			component: SelectDialog,
			props: {
				title: KEEP_FIELD.name,
				subtitle: KEEP_FIELD.description,
				options: KEEP_FIELD.options.map((option) => option.label),
				selectedOption: keepLabel,
				handleSelectOption: (label: string) =>
					updateMovieRequestRule(tmdbId, {
						keepWatchedHours:
							KEEP_FIELD.options.find((option) => option.label === label)?.value ?? null
					}).catch((e) =>
						createErrorNotification(
							'Could not update the setting',
							e?.response?.data?.message ?? e?.message
						)
					)
			}
		});
	}

	/** What a new request is expected to take from its source, if it has one */
	$: sourceBytes = source?.torrent?.size ?? source?.file?.size ?? 0;

	async function request(requested: boolean) {
		if (requested && !(await confirmQuota(sourceBytes))) return;

		await setMovieRequested(tmdbId, requested);
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
	<Container class="flex-1 min-h-0 flex flex-col">
		<div class="mx-32 mt-16">
			<div class="flex justify-between items-end">
				<div class="min-w-0">
					<HeroTitleInfo
						overview=""
						properties={[{ label: 'Select to request' }, { label: 'Right to choose a torrent' }]}
					>
						<span slot="title" class="block truncate leading-tight">{movie?.title ?? ''}</span>
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
				<SelectField
					class="flex-1"
					value={keepLabel}
					disabled={!ruleData}
					on:clickOrSelect={selectKeepOption}
					type="transparent"
				>
					{KEEP_FIELD.name}
					<ChevronDown slot="icon" let:size let:iconClass {size} class={classNames(iconClass)} />
				</SelectField>
			</Container>

			<div class="divider mt-4" />
		</div>

		<Container focusOnMount class="pb-16 mx-32 mt-8">
			{#if movie}
				<RequestRow
					subtitle={sourceTitle ?? 'No torrent selected'}
					status={getStatusLabel(status)}
					isError={isErrorStatus(status)}
					checked={!!status?.requested}
					on:toggle={() =>
						request(!status?.requested).catch((e) =>
							createErrorNotification(
								'Could not update the request',
								e?.response?.data?.message ?? e?.message
							)
						)}
					on:open={() => componentStack.push({ component: TorrentsView, props: { tmdbId, name } })}
				>
					{name}
				</RequestRow>
			{:else}
				<div class="h-ghost m-auto">
					{#if $tmdbMovie.isLoading}
						Loading...
					{:else}
						Could not load movie.
					{/if}
				</div>
			{/if}
		</Container>
	</Container>
</Container>
