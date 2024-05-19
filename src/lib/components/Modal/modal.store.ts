import type { ComponentType, SvelteComponentTyped } from 'svelte';
import { derived, get, writable } from 'svelte/store';
import SeasonMediaManagerModal from '../MediaManagerModal/SeasonMediaManagerModal.svelte';
import EpisodeMediaManagerModal from '../MediaManagerModal/EpisodeMediaManagerModal.svelte';
import MovieMediaManagerModal from '../MediaManagerModal/MovieMediaManagerModal.svelte';
import ConfirmDialog from '../Dialog/ConfirmDialog.svelte';
import { sonarrApi, type SonarrSeries } from '../../apis/sonarr/sonarr-api';

type ModalItem = {
	id: symbol;
	group: symbol;
	component: ConstructorOfATypedSvelteComponent;
	props: Record<string, any>;
};
function createModalStack() {
	const items = writable<ModalItem[]>([]);
	const top = derived(items, ($items) => $items[$items.length - 1]);

	function close(symbol: symbol) {
		items.update((prev) => prev.filter((i) => i.id !== symbol));
	}

	function closeGroup(group: symbol) {
		items.update((prev) => prev.filter((i) => i.group !== group));
	}

	function create<P extends Record<string, any>>(
		component: ComponentType<SvelteComponentTyped<P>>,
		props: Omit<P, 'modal' | 'groupId' | 'modalId' | 'hidden'>,
		group: symbol | undefined = undefined
	) {
		const id = Symbol();
		const item = { id, component, props, group: group || id };
		items.update((prev) => [...prev, item]);
		return id;
	}

	function reset() {
		items.set([]);
	}

	function closeTopmost() {
		const t = get(top);
		if (t) {
			close(t.id);
		}
	}

	return {
		subscribe: items.subscribe,
		top: {
			subscribe: top.subscribe
		},
		create,
		close,
		closeGroup,
		closeTopmost,
		reset
	};
}

export const modalStack = createModalStack();
export const modalStackTop = modalStack.top;
export const createModal = modalStack.create;

export const openSeasonMediaManager = (sonarrItem: SonarrSeries, season: number) =>
	modalStack.create(SeasonMediaManagerModal, { sonarrItem, season });

export const openEpisodeMediaManager = (tmdbId: number, season: number, episode: number) =>
	modalStack.create(EpisodeMediaManagerModal, { id: tmdbId, season, episode });

export const openMovieMediaManager = (tmdbId: number) =>
	modalStack.create(MovieMediaManagerModal, { id: tmdbId });

// let lastTitleModal: symbol | undefined = undefined;
// export function openTitleModal(titleId: TitleId) {
// 	if (lastTitleModal) {
// 		modalStack.close(lastTitleModal);
// 	}
// 	lastTitleModal = modalStack.create(TitlePageModal, {
// 		titleId
// 	});
// }
