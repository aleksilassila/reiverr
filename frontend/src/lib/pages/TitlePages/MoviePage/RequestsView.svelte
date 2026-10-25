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
	import { confirmQuota } from '$lib/quota';
	import { useData } from '$lib/stores/data/data.store';
	import { useMovieContext } from '$lib/stores/data/movie-data.store';
	import { getStatusLabel, isErrorStatus } from '$lib/stores/data/request-status';
	import { reiverrApi, user } from '$lib/stores/user.store';
	import classNames from 'classnames';
	import { ChevronDown, Cross1 } from 'radix-icons-svelte';
	import { onDestroy } from 'svelte';
	import { readable } from 'svelte/store';
	import HeroTitleInfo from '../HeroTitleInfo.svelte';
	import RequestRow from '../SeriesPage/RequestRow.svelte';
	import TorrentsView from './TorrentsView.svelte';

	export let tmdbId: string;

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
	const movieData = useMovieContext(tmdbId).getContext();
	const status = movieData.statusData?.data ?? readable(undefined);
	const tmdbMovie = movieData.movieData?.data ?? readable(undefined);
	const tmdbMovieLoading = movieData.movieData?.isLoading ?? readable(false);

	const rule = useData(() =>
		reiverrApi.requests.getMovieRequestRule($user?.id as string, tmdbId).then((r) => r.data)
	);
	const ruleData = rule.data;

	const storage = useData(() =>
		reiverrApi.library.getUserStorage($user?.id as string).then((r) => r.data)
	);
	const storageData = storage.data;

	$: name = $tmdbMovie
		? `${$tmdbMovie.title} (${new Date($tmdbMovie.release_date ?? 0).getFullYear()})`
		: '';
	$: keepLabel =
		KEEP_FIELD.options.find((option) => option.value === ($ruleData?.keepWatchedHours ?? null))
			?.label ?? '';
	$: source = $status?.preference;
	$: sourceTitle = source?.torrent?.title ?? source?.file?.fileName;

	function selectKeepOption() {
		if (!$ruleData) return;

		componentStack.push({
			component: SelectDialog,
			props: {
				title: KEEP_FIELD.name,
				subtitle: KEEP_FIELD.description,
				options: KEEP_FIELD.options.map((option) => option.label),
				selectedOption: keepLabel,
				handleSelectOption: (label: string) =>
					reiverrApi.requests
						.updateMovieRequestRule($user?.id as string, tmdbId, {
							keepWatchedHours:
								KEEP_FIELD.options.find((option) => option.label === label)?.value ?? null
						})
						.then(() => Promise.all([rule.update(), movieData.statusData?.update()]))
						.catch((e) =>
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

		await movieData.setRequested?.(requested);
		await storage.update();
	}

	// Download progress and usage change without the user doing anything
	const refresh = setInterval(() => {
		movieData.statusData?.update();
		storage.update();
	}, REFRESH_INTERVAL);
	onDestroy(() => clearInterval(refresh));
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
						<span slot="title" class="block truncate leading-tight">{$tmdbMovie?.title ?? ''}</span>
					</HeroTitleInfo>
				</div>
				{#if $storageData && $storageData.quotaBytes !== null}
					<StorageQuota
						class="flex-shrink-0 ml-8"
						quotaBytes={$storageData.quotaBytes}
						usedBytes={$storageData.heldBytes + $storageData.pendingBytes}
					/>
				{/if}
			</div>

			<Container direction="horizontal" class="flex space-x-4 mt-6">
				<SelectField
					class="flex-1"
					value={keepLabel}
					disabled={!$ruleData}
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
			{#if $tmdbMovie}
				<RequestRow
					subtitle={sourceTitle ?? 'No torrent selected'}
					status={getStatusLabel($status)}
					isError={isErrorStatus($status)}
					checked={!!$status?.requested}
					on:toggle={() =>
						request(!$status?.requested).catch((e) =>
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
					{#if $tmdbMovieLoading}
						Loading...
					{:else}
						Could not load movie.
					{/if}
				</div>
			{/if}
		</Container>
	</Container>
</Container>
