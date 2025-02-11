<script lang="ts">
	import Dialog from '../Dialog/Dialog.svelte';
	import Container from '../Container.svelte';
	import Button from '../Button.svelte';
	import { ArrowRight, Check, Plus, Trash } from 'radix-icons-svelte';
	import { modalStack } from '../Modal/modal.store';
	import {
		sonarrApi,
		type SonarrMonitorOptions,
		sonarrMonitorOptions
	} from '../../apis/sonarr/sonarr-api';
	import { TMDB_BACKDROP_SMALL } from '../../constants';
	import classNames from 'classnames';
	import { type BackEvent, scrollIntoView, Selectable } from '../../selectable';
	import { fade } from 'svelte/transition';
	import { createLocalStorageStore } from '../../stores/localstorage.store';
	import { formatSize } from '../../utils';
	import { capitalize } from '../../utils.js';

	type AddOptionsStore = {
		rootFolderPath: string | null;
		qualityProfileId: number | null;
		monitorOptions: SonarrMonitorOptions | null;
	};

	export let backdropUri: string;
	export let tmdbId: number;
	export let title: string;

	export let modalId: symbol;
	export let onComplete: (() => void) | (() => Promise<any>) = () => Promise.resolve();
	$: backgroundUrl = TMDB_BACKDROP_SMALL + backdropUri;

	let tab: 'add-to-sonarr' | 'root-folders' | 'quality-profiles' | 'monitor-settings' =
		'add-to-sonarr';
	let addToSonarrTab: Selectable;
	let rootFoldersTab: Selectable;
	let qualityProfilesTab: Selectable;
	let monitorSettingsTab: Selectable;
	$: {
		if (tab === 'add-to-sonarr' && addToSonarrTab) addToSonarrTab.focus();
		if (tab === 'root-folders' && rootFoldersTab) rootFoldersTab.focus();
		if (tab === 'quality-profiles' && qualityProfilesTab) qualityProfilesTab.focus();
		if (tab === 'monitor-settings' && monitorSettingsTab) monitorSettingsTab.focus();
	}
	const addOptionsStore = createLocalStorageStore<AddOptionsStore>('add-to-sonarr-options', {
		rootFolderPath: null,
		qualityProfileId: null,
		monitorOptions: null
	});

	const sonarrOptions = Promise.all([
		sonarrApi.getRootFolders(),
		sonarrApi.getQualityProfiles()
	]).then(([rootFolders, qualityProfiles]) => ({ rootFolders, qualityProfiles }));

	sonarrOptions.then((s) => {
		addOptionsStore.update((prev) => ({
			rootFolderPath: prev.rootFolderPath || s.rootFolders[0]?.path || null,
			qualityProfileId: prev.qualityProfileId || s.qualityProfiles[0]?.id || null,
			monitorOptions: prev.monitorOptions || 'none'
		}));
	});
	addOptionsStore.subscribe(() => (tab = 'add-to-sonarr'));

	async function handleAddToSonarr() {
		return sonarrApi
			.addToSonarr(tmdbId as number, {
				rootFolderPath: $addOptionsStore.rootFolderPath || undefined,
				monitorOptions: $addOptionsStore.monitorOptions || undefined,
				qualityProfileId: $addOptionsStore.qualityProfileId || undefined
			})
			.then((success) => {
				if (success) {
					modalStack.close(modalId);
					return onComplete();
				}
			});
	}

	function handleBack(e: BackEvent) {
		if (tab !== 'add-to-sonarr') {
			tab = 'add-to-sonarr';
			e.detail.stopPropagation();
		}
	}

	const tabClasses = (active: boolean, secondary: boolean = false) =>
		classNames('flex flex-col transition-all', {
			'opacity-0 pointer-events-none': !active,
			'-translate-x-10': !active && !secondary,
			'translate-x-10': !active && secondary,
			'absolute inset-0': secondary
		});

	const listItemClass = `flex items-center justify-between bg-primary-900 rounded-xl px-6 py-2.5 mb-4 font-medium
		border-2 border-transparent focus:border-primary-500 hover:border-primary-500 cursor-pointer group`;

	const scaledArrowClas = (hasFocus: boolean) =>
		classNames('transition-transform', {
			'text-primary-500 translate-x-0.5 scale-110': hasFocus,
			'group-hover:text-primary-500 group-hover:translate-x-0.5 group-hover:scale-110': true
		});
</script>

<Dialog>
	{#if backgroundUrl && tab === 'add-to-sonarr'}
		<div
			transition:fade={{ duration: 200 }}
			class="absolute inset-0 bg-cover bg-center h-52"
			style="background-image: url({backgroundUrl}); -webkit-mask-image: radial-gradient(at 90% 10%, hsla(0,0%,0%,1) 0px, transparent 70%);"
		/>
	{/if}

	{#await sonarrOptions then { qualityProfiles, rootFolders }}
		{@const selectedRootFolder = rootFolders.find(
			(f) => f.path === $addOptionsStore.rootFolderPath
		)}
		{@const selectedQualityProfile = qualityProfiles.find(
			(f) => f.id === $addOptionsStore.qualityProfileId
		)}
		<Container on:back={handleBack} class="relative">
			<Container
				trapFocus
				bind:selectable={addToSonarrTab}
				class={tabClasses(tab === 'add-to-sonarr')}
			>
				<div class="z-10 mb-8">
					<div class="h-24" />
					<h1 class="h3">Add {title} to Sonarr?</h1>
					<div class="font-medium text-secondary-300 mb-8">
						Before you can fetch episodes, you need to add this series to Sonarr.
					</div>
					<Container
						class={listItemClass}
						on:clickOrSelect={() => (tab = 'root-folders')}
						let:hasFocus
					>
						<div>
							<h1 class="text-secondary-300 font-semibold tracking-wide text-sm">Root Folder</h1>
							{selectedRootFolder?.path}
							({formatSize(selectedRootFolder?.freeSpace || 0)} left)
						</div>
						<ArrowRight class={scaledArrowClas(hasFocus)} size={24} />
					</Container>

					<Container
						class={listItemClass}
						on:clickOrSelect={() => (tab = 'quality-profiles')}
						let:hasFocus
					>
						<div>
							<h1 class="text-secondary-300 font-semibold tracking-wide text-sm">
								Quality Profile
							</h1>
							<span>
								{selectedQualityProfile?.name}
							</span>
						</div>
						<ArrowRight class={scaledArrowClas(hasFocus)} size={24} />
					</Container>

					<Container
						class={listItemClass}
						on:clickOrSelect={() => (tab = 'monitor-settings')}
						let:hasFocus
					>
						<div>
							<h1 class="text-secondary-300 font-semibold tracking-wide text-sm">
								Monitor Strategy
							</h1>
							<span>
								{capitalize($addOptionsStore.monitorOptions || 'none')}
							</span>
						</div>
						<ArrowRight class={scaledArrowClas(hasFocus)} size={24} />
					</Container>

					<!--					<Container class="flex items-center" on:clickOrSelect={() => (tab = 'quality-profiles')}>-->
					<!--						{qualityProfile?.name}-->
					<!--						<ArrowRight size={19} />-->
					<!--					</Container>-->
					<!--					<Container class="flex items-center" on:clickOrSelect={() => (tab = 'monitor-settings')}>-->
					<!--						Monitor {$addOptionsStore.monitorSettings}-->
					<!--						<ArrowRight size={19} />-->
					<!--					</Container>-->
				</div>
				<Container class="flex flex-col space-y-4">
					<Button type="primary-dark" action={handleAddToSonarr} focusOnMount>
						<Plus size={19} slot="icon" />
						Add to Sonarr
					</Button>
					<Button type="primary-dark" on:clickOrSelect={() => modalStack.close(modalId)}
						>Cancel</Button
					>
				</Container>
			</Container>

			<Container
				trapFocus
				class={tabClasses(tab === 'root-folders', true)}
				bind:selectable={rootFoldersTab}
			>
				<h1 class="text-xl text-secondary-100 font-medium mb-4">Root Folder</h1>
				<div class="min-h-0 overflow-y-auto scrollbar-hide">
					{#each rootFolders as rootFolder}
						<Container
							class={listItemClass}
							on:enter={scrollIntoView({ vertical: 64 })}
							on:clickOrSelect={() =>
								addOptionsStore.update((prev) => ({ ...prev, rootFolderId: rootFolder.id || 0 }))}
							focusOnClick
							focusOnMount={$addOptionsStore.rootFolderPath === rootFolder.path}
						>
							<div>
								{rootFolder.path} ({formatSize(rootFolder.freeSpace || 0)} left)
							</div>
							{#if selectedRootFolder?.id === rootFolder.id}
								<Check size={24} />
							{/if}
						</Container>
					{/each}
				</div>
			</Container>

			<Container
				trapFocus
				class={tabClasses(tab === 'quality-profiles', true)}
				bind:selectable={qualityProfilesTab}
			>
				<h1 class="text-xl text-secondary-100 font-medium mb-4">Quality Profile</h1>
				<div class="min-h-0 overflow-y-auto scrollbar-hide">
					{#each qualityProfiles as qualityProfile}
						<Container
							class={listItemClass}
							on:enter={scrollIntoView({ vertical: 64 })}
							on:clickOrSelect={() =>
								addOptionsStore.update((prev) => ({
									...prev,
									qualityProfileId: qualityProfile.id || 0
								}))}
							focusOnClick
							focusOnMount={$addOptionsStore.qualityProfileId === qualityProfile.id}
						>
							<div>{qualityProfile.name}</div>
							{#if selectedQualityProfile?.id === qualityProfile.id}
								<Check size={24} />
							{/if}
						</Container>
					{/each}
				</div>
			</Container>

			<Container
				trapFocus
				class={tabClasses(tab === 'monitor-settings', true)}
				bind:selectable={monitorSettingsTab}
			>
				<h1 class="text-xl text-secondary-100 font-medium mb-4">Monitor Episodes</h1>
				<div class="min-h-0 overflow-y-auto scrollbar-hide">
					{#each sonarrMonitorOptions as monitorOption}
						<Container
							class={listItemClass}
							on:enter={scrollIntoView({ vertical: 64 })}
							on:clickOrSelect={() =>
								addOptionsStore.update((prev) => ({ ...prev, monitorOptions: monitorOption }))}
							focusOnClick
							focusOnMount={$addOptionsStore.monitorOptions === monitorOption}
						>
							<div>{capitalize(monitorOption)}</div>
							{#if $addOptionsStore.monitorOptions === monitorOption}
								<Check size={24} />
							{/if}
						</Container>
					{/each}
				</div>
			</Container>
		</Container>
	{/await}
</Dialog>
