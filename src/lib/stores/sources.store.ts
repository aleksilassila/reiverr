import { writable } from 'svelte/store';
import type { MediaSource, SourceProviderCapabilitiesDto } from '../apis/reiverr/reiverr.openapi';
import { reiverrApiNew, user } from './user.store';

function useSources() {
	const sources = writable<
		{
			source: MediaSource;
			capabilities: SourceProviderCapabilitiesDto;
		}[]
	>([]);

	user.subscribe(async (user) => {
		if (!user) {
			sources.set([]);
			return;
		}

		const out: { source: MediaSource; capabilities: SourceProviderCapabilitiesDto }[] = [];

		user?.mediaSources
			?.filter((s) => s.enabled)
			?.forEach(async (s) => {
				out.push({
					source: s,
					capabilities: await reiverrApiNew.providers
						.getSourceCapabilities(s.pluginId)
						.then((r) => r.data)
				});
			});

		sources.set(out);
	});

	// const availableSources = derived(
	// 	user,
	// 	(user) => user?.mediaSources?.filter((s) => s.enabled)?.map((s) => ({ ...s })) ?? []
	// );

	return {
		subscribe: sources.subscribe
	};
}

export const sources = useSources();
