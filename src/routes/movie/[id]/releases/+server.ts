import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { _parseMovieId } from '../+server';
import {
	cancelDownloadRadarrMovie,
	addRadarrMovie,
	fetchRadarrReleases,
	downloadRadarrMovie
} from '$lib/apis/radarr/radarrApi';

export const GET = (async ({ params }) => {
	const radarrId = _parseMovieId(params);

	const releases: any[] = (await fetchRadarrReleases(radarrId)) || [];

	let filtered = releases.slice();

	filtered.sort((a, b) => b.seeders - a.seeders);
	filtered = filtered.filter((release) => release.quality.quality.resolution > 720).slice(0, 5);

	const releasesSkipped = releases.length - filtered.length;

	releases.sort((a, b) => b.size - a.size);
	filtered.sort((a, b) => b.size - a.size);

	return json({
		filtered,
		releasesSkipped,
		allReleases: releases
	});
}) satisfies RequestHandler;

// Download movie
export const POST = (async ({ params, request }) => {
	const body = await request.json();

	if (!body.guid) throw new Error('NO_GUID');

	const response = await downloadRadarrMovie(body.guid);

	return json(response);
}) satisfies RequestHandler;

export const DELETE = (async ({ params }) => {
	const downloadId = _parseMovieId(params);

	const success = await cancelDownloadRadarrMovie(downloadId);

	return json({ success });
}) satisfies RequestHandler;
