import { derived, writable } from 'svelte/store';
import type { MediaSource, SourcePluginCapabilitiesDto } from '../apis/reiverr/reiverr.openapi';
import { reiverrApiNew, user } from './user.store';

function useSources() {
	const sources = writable<{ source: MediaSource; capabilities: SourcePluginCapabilitiesDto }[]>(
		[]
	);

	user.subscribe(async (user) => {
		if (!user) {
			sources.set([]);
			return;
		}

		const out: { source: MediaSource; capabilities: SourcePluginCapabilitiesDto }[] = [];

		user?.mediaSources
			?.filter((s) => s.enabled)
			?.forEach(async (s) => {
				out.push({
					source: s,
					capabilities: await reiverrApiNew.sources
						.getSourceCapabilities(s.id, s.pluginSettings ?? ({} as any))
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
