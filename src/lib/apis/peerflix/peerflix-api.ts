import axios from 'axios';
import { get } from 'svelte/store';
import { user } from '../../stores/user.store';

interface AddTorrentResponse {
	infoHash: string;
}

export interface GetTorrentResponse {
	infoHash: string;
	name: string;
	length: number;
	interested: boolean;
	ready: boolean;
	files: File[];
	progress: number[];
}

export interface File {
	name: string;
	path: string;
	link: string;
	length: number;
	offset: number;
	selected: boolean;
}

export class PeerflixApi {
	getBaseUrl() {
		return get(user)?.settings.peerflix.baseUrl || '';
	}

	private addTorrent = async (link: string) =>
		axios.post<AddTorrentResponse>(this.getBaseUrl() + '/torrents', {
			link
		});

	getTorrent = async (link: string) => {
		const { infoHash } = await this.addTorrent(link).then((r) => r.data);

		for (let i = 0; i < 15; i++) {
			const res = await axios
				.get<GetTorrentResponse>(this.getBaseUrl() + '/torrents/' + infoHash)
				.then((r) => r.data);

			if (res.files?.length) {
				return res;
			}

			await new Promise((r) => setTimeout(r, 1000));
		}
	};
}

export const peerflixApi = new PeerflixApi();
