<script lang="ts">
	import type { RequestProfileDto } from '$lib/apis/reiverr/reiverr.openapi';
	import Button from '$lib/components/Button/Button.svelte';
	import Container from '$lib/components/Container.svelte';
	import type { Request } from '$lib/stores/data/series-data.store';
	import { reiverrApi } from '$lib/stores/user.store';
	import classNames from 'classnames';

	export let tmdbId: string;
	export let profiles: RequestProfileDto[] = [];
	export let requests: Map<string, Request[]> = new Map();
	export let selectedEpisodes: Set<string> = new Set();
	export let cb: () => Promise<void> = () => Promise.resolve();

	let toBeDeleted = new Set<string>();
	let toBeAdded = new Set<string>();

	// Prune toBeDeleted: only keep profiles that still have a request in at least one selected episode
	$: {
		const validDeletes = new Set<string>();
		for (const pid of toBeDeleted) {
			if (
				[...selectedEpisodes].some((key) => requests.get(key)?.some((r) => r.profileId === pid))
			) {
				validDeletes.add(pid);
			}
		}
		if (validDeletes.size !== toBeDeleted.size) {
			toBeDeleted = validDeletes;
		}
	}

	// Prune toBeAdded: only keep profiles that are still missing from at least one selected episode
	$: {
		const validAdds = new Set<string>();
		for (const pluginProfileId of toBeAdded) {
			if (
				selectedEpisodes.size === 0 ||
				![...selectedEpisodes].every((key) =>
					requests.get(key)?.some((r) => `${r.pluginId}:${r.profileId}` === pluginProfileId)
				)
			) {
				validAdds.add(pluginProfileId);
			}
		}
		if (validAdds.size !== toBeAdded.size) {
			toBeAdded = validAdds;
		}
	}

	// Profiles where at least one selected episode has a request with that profileId
	$: removeProfiles = profiles.filter((p) => {
		if (toBeAdded.has(`${p.pluginId}:${p.id}`)) return false;
		return [...selectedEpisodes].some((key) =>
			requests.get(key)?.some((r) => r.profileId === p.id)
		);
	});

	// Profiles NOT present in ALL selected episodes (excluding those marked for deletion)
	$: addProfiles = profiles.filter((p) => {
		if (toBeDeleted.has(p.id)) return false;
		if (selectedEpisodes.size === 0) return true;
		return ![...selectedEpisodes].every((key) =>
			requests.get(key)?.some((r) => r.profileId === p.id)
		);
	});

	function toggleDelete(profileId: string) {
		toBeDeleted = new Set(toBeDeleted);
		if (toBeDeleted.has(profileId)) {
			toBeDeleted.delete(profileId);
		} else {
			toBeDeleted.add(profileId);
		}
	}

	function toggleAdd(profileId: string) {
		toBeAdded = new Set(toBeAdded);
		if (toBeAdded.has(profileId)) {
			toBeAdded.delete(profileId);
		} else {
			toBeAdded.add(profileId);
		}
	}

	async function applyChanges() {
		return reiverrApi.requests
			.updateRequests(
				{
					tmdbId,
					type: 'series'
				},
				{
					episodeIds: [...selectedEpisodes],
					pluginProfilesToAdd: [...toBeAdded],
					pluginRequestsToDelete: requests
						.values()
						.toArray()
						.flat()
						.filter(
							(r) =>
								toBeDeleted.has(r.profileId) &&
								selectedEpisodes.has(`${r.mediaItem.season}-${r.mediaItem.episode}`)
						)
						.map((r) => `${r.pluginId}:${r.id}`)
				}
			)
			.then(() => cb());
	}
</script>

{#if removeProfiles.length > 0 && selectedEpisodes.size > 0}
	<div class="mb-6">
		<div class="text-lg font-semibold text-secondary-400 mb-3">Remove Requests</div>
		<Container direction="horizontal" class="flex flex-wrap gap-2">
			{#each removeProfiles as profile (profile.id)}
				<Container focusOnClick let:hasFocus on:clickOrSelect={() => toggleDelete(profile.id)}>
					<div
						class={classNames(
							'px-4 py-2 rounded-xl cursor-pointer text-base font-medium transition-colors',
							{
								'bg-red-500/20 text-red-400 border border-red-500': toBeDeleted.has(profile.id),
								'bg-secondary-800 text-secondary-300 border border-secondary-700':
									!toBeDeleted.has(profile.id) && !hasFocus,
								'bg-secondary-700 text-primary-400 border border-primary-500':
									!toBeDeleted.has(profile.id) && hasFocus
							}
						)}
					>
						{profile.label}
					</div>
				</Container>
			{/each}
		</Container>
	</div>
{/if}

{#if addProfiles.length > 0 && selectedEpisodes.size > 0}
	<div class="mb-6">
		<div class="text-lg font-semibold text-secondary-400 mb-3">Add Requests</div>
		<Container direction="horizontal" class="flex flex-wrap gap-2">
			{#each addProfiles as profile (profile.id)}
				<Container
					focusOnClick
					let:hasFocus
					on:clickOrSelect={() => toggleAdd(`${profile.pluginId}:${profile.id}`)}
				>
					<div
						class={classNames(
							'px-4 py-2 rounded-xl cursor-pointer text-base font-medium transition-colors',
							{
								'bg-green-500/20 text-green-400 border border-green-500': toBeAdded.has(
									`${profile.pluginId}:${profile.id}`
								),
								'bg-secondary-800 text-secondary-300 border border-secondary-700':
									!toBeAdded.has(`${profile.pluginId}:${profile.id}`) && !hasFocus,
								'bg-secondary-700 text-primary-400 border border-primary-500':
									!toBeAdded.has(`${profile.pluginId}:${profile.id}`) && hasFocus
							}
						)}
					>
						{profile.label}
					</div>
				</Container>
			{/each}
		</Container>
	</div>
{/if}

<Button
	disabled={toBeDeleted.size === 0 && toBeAdded.size === 0}
	type="primary"
	action={applyChanges}
>
	Apply Changes
</Button>
