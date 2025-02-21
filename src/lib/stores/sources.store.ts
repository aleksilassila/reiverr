import { createErrorNotification } from '$lib/components/Notifications/notification.store';
import { get, writable } from 'svelte/store';
import type { MediaSourceDto } from '../apis/reiverr/reiverr.openapi';
import { reiverrApiNew, user } from './user.store';

function useSources() {
	const sources = writable<MediaSourceDto[]>([]);
	const isLoading = writable(true);

	user.subscribe(async (user) => {
		if (!user) {
			sources.set([]);
			isLoading.set(user === undefined);
			return;
		}

		const out = user?.mediaSources ?? [];

		sources.set(out);
		isLoading.set(false);
	});

	function setSource(source: MediaSourceDto) {
		const updatedIndex = get(sources).findIndex((s) => s.id === source.id);

		sources.update((s) => {
			if (updatedIndex === -1) {
				return [...s, source];
			}

			s[updatedIndex] = source;
			return s.sort((a, b) => a.priority - b.priority);
		});
	}

	async function addSource(providerId: string) {
		const userId = get(user)?.id;

		if (!userId) {
			createErrorNotification('User not found');
			return;
		}

		const { mediaSource: updated } = await reiverrApiNew.users
			.updateSource(userId, { pluginId: providerId })
			.then((r) => r.data);

		setSource(updated);
	}

	async function updateSource(mediaSource: MediaSourceDto) {
		const updateResponse = await reiverrApiNew.users
			.updateSource(get(user)?.id || '', {
				id: mediaSource.id,
				name: mediaSource.name,
				pluginId: mediaSource.pluginId,
				pluginSettings: mediaSource.pluginSettings
			})
			.then((r) => r.data);
		setSource(updateResponse.mediaSource);
		updateResponse.validationResponse;

		return updateResponse;
	}

	async function deleteSource(mediaSourceId: string) {
		await reiverrApiNew.users.deleteSource(mediaSourceId, get(user)?.id || '');
		sources.update((s) => s.filter((source) => source.id !== mediaSourceId));
	}

	// const availableSources = derived(
	// 	user,
	// 	(user) => user?.mediaSources?.filter((s) => s.enabled)?.map((s) => ({ ...s })) ?? []
	// );

	return {
		subscribe: sources.subscribe,
		isLoading: { subscribe: isLoading.subscribe },
		addSource,
		updateSource,
		deleteSource
	};
}

export const sources = useSources();
