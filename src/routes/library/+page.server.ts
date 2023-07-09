import type { PageServerLoad } from './$types';
import { RadarrApi, getRadarrMovies } from '$lib/apis/radarr/radarrApi';
import type { CardProps } from '$lib/components/Card/card';
import { fetchCardProps } from '$lib/components/Card/card';

// interface DownloadingCardProps extends CardProps {
// 	progress: number;
// 	completionTime: string;
// }

// export const load = (() => {
// 	const [downloading, available, unavailable] = getLibraryItems();

// 	// radarrMovies.then((d) => console.log(d.map((m) => m.ratings)));

// 	const libraryInfo = getLibraryInfo();

// 	return {
// 		streamed: {
// 			libraryInfo,
// 			downloading,
// 			available,
// 			unavailable
// 		}
// 	};
// }) satisfies PageServerLoad;

// async function getLibraryInfo(): Promise<any> {}
