export type TitleType = 'movie' | 'series' | 'person';
export type TitleId = {
	id: number;
	provider: 'tmdb' | 'tvdb';
	type: TitleType;
};

declare global {
	const REIVERR_VERSION: string;
}
