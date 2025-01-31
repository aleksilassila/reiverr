export type TitleType = 'movie' | 'series' | 'person';
export type TitleId = {
	id: number;
	provider: 'tmdb' | 'tvdb';
	type: TitleType;
};

export type MediaType = 'Movie' | 'Series';

declare global {
	const REIVERR_VERSION: string;
}
