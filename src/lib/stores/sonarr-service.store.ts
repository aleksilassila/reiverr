import { writable } from 'svelte/store';
import { sonarrApi, type SonarrRootFolder } from '../apis/sonarr/sonarr-api';

type SonarrServiceStore = ReturnType<typeof fetchSonarrService>;

async function fetchSonarrService() {
	const rootFolders = sonarrApi.getRootFolders();
	const qualityProfiles = sonarrApi.getQualityProfiles();

	return {
		rootFolders: await rootFolders,
		qualityProfiles: await qualityProfiles
	};
}

function useSonarrService() {
	const sonarrService = writable<SonarrServiceStore>(fetchSonarrService());

	return {
		subscribe: sonarrService.subscribe
	};
}

export const sonarrService = useSonarrService();
