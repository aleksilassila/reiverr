import { Settings } from '$lib/entities/Settings';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const settings = await Settings.get();

	return {
		settings
	};
};
