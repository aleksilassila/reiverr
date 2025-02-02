import type {
	MediaSource,
	MediaUserDataDto,
	VideoStreamCandidateDto
} from '../../../apis/reiverr/reiverr.openapi';
import type { TmdbMovieFull2, TmdbSeason } from '../../../apis/tmdb/tmdb-api';
import { createModal } from '../../../components/Modal/modal.store';
import { playerState } from '../../../components/VideoPlayer/VideoPlayer';
import { reiverrApiNew } from '../../../stores/user.store';
import StreamSelectorModal from '../StreamSelectorModal.svelte';

type Episode = Pick<
	NonNullable<TmdbSeason['episodes']>[0],
	'id' | 'season_number' | 'episode_number' | 'name' | 'show_id'
>;

type TmdbItem = TmdbMovieFull2 | Episode;

async function getStreams(
	tmdbItem: TmdbItem,
	source: MediaSource
): Promise<VideoStreamCandidateDto[]> {
	const id = String('show_id' in tmdbItem ? tmdbItem.show_id : tmdbItem.id);

	if (!id) {
		throw new Error('No id found');
	}

	if ('season_number' in tmdbItem) {
		return reiverrApiNew.sources
			.getEpisodeStreams(source.id, id, tmdbItem.season_number ?? 1, tmdbItem.episode_number ?? 1)
			.then((r) => r.data?.streams ?? []);
	} else {
		return reiverrApiNew.sources.getMovieStreams(source.id, id).then((r) => r.data?.streams ?? []);
	}

	return [];
}

async function playStream(
	tmdbItem: TmdbItem,
	userData: MediaUserDataDto,
	source: MediaSource,
	stream: VideoStreamCandidateDto
) {
	const id = String('show_id' in tmdbItem ? tmdbItem.show_id : tmdbItem.id);

	if (!id) {
		throw new Error('No id found');
	}

	if ('season_number' in tmdbItem) {
		return playerState.streamEpisode(
			id,
			tmdbItem.season_number ?? 1,
			tmdbItem.episode_number ?? 1,
			{
				sourceId: source.id,
				key: stream.key,
				userData
			}
		);
	} else {
		return playerState.streamMovie(id, { sourceId: source.id, key: stream.key, userData });
	}
}

export function handleOpenStreamSelector(tmdbItem: TmdbItem, userData: MediaUserDataDto) {
	createModal(StreamSelectorModal, {
		getStreams: (s) => getStreams(tmdbItem, s),
		selectStream: (source, stream) => playStream(tmdbItem, userData, source, stream)
	});
}
