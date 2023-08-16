import { Settings } from '$lib/entities/Settings';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	return json(await Settings.get());
};
