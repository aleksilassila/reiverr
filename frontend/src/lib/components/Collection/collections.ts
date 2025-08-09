import { TMDB_BACKDROP_SMALL } from '$lib/constants';
import { tmdbApi } from '$lib/stores/user.store';

export type Network = {
	name: string;
	route: string;
	id: number;
};

export type Collection = {
	name: string;
	route: string;
	id: number;
	backdropUrl?: string;
};

export type Company = {
	name: string;
	route: string;
	id: number;
	backdropUrl?: string;
};

export const networks: Record<string, Network> = {
	netflix: {
		name: 'Netflix',
		route: 'netflix',
		id: 213
	},
	disney: {
		name: 'Disney+',
		route: 'disney',
		id: 2739
	},
	hbo: {
		name: 'HBO',
		route: 'hbo',
		id: 49
	},
	hulu: {
		name: 'Hulu',
		route: 'hulu',
		id: 453
	},
	amazon: {
		name: 'Amazon',
		route: 'amazon',
		id: 1024
	},
	apple: {
		name: 'Apple TV+',
		route: 'apple',
		id: 2552
	}
};

// export const collections: Record<string, Collection> = {
// 	'best-picture-winners': {
// 		name: 'The Golden Globes: Best Picture Winners',
// 		route: 'best-picture-winners',
// 		id: 2469,
// 		backdropUrl: `${TMDB_BACKDROP_SMALL}/xQyGkQ8ICa4lgifGr3oZjkm3AJ2.jpg`
// 	},
// 	'2025-oscar-nominations-for-best-picture': {
// 		name: '2025 Oscar Nominations for Best Picture',
// 		route: '2025-oscar-nominations-for-best-picture',
// 		id: 8512095,
// 		backdropUrl: `${TMDB_BACKDROP_SMALL}/hmZnqijPaaACjenDkrbWcCmcADI.jpg`
// 	},
// 	'2024-oscar-nominations-for-best-picture': {
// 		name: '2024 Oscar Nominations for Best Picture',
// 		route: '2024-oscar-nominations-for-best-picture',
// 		id: 8304073,
// 		backdropUrl: `${TMDB_BACKDROP_SMALL}/ycnO0cjsAROSGJKuMODgRtWsHQw.jpg`
// 	}
// };

export const collections: Record<string, Collection> = {
	'best-picture-winners-golden-globes': {
		name: 'Best Picture Winners - The Golden Globes',
		route: 'best-picture-winners-golden-globes',
		id: 2469,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/xQyGkQ8ICa4lgifGr3oZjkm3AJ2.jpg`
	},
	'best-picture-winners-academy-awards': {
		name: 'Best Picture Winners - The Academy Awards',
		route: 'best-picture-winners-academy-awards',
		id: 28,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/ycnO0cjsAROSGJKuMODgRtWsHQw.jpg`
	},
	'2025-oscar-nominations-for-best-picture': {
		name: '2025 Oscar Nominations for Best Picture',
		route: '2025-oscar-nominations-for-best-picture',
		id: 8512095,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/hmZnqijPaaACjenDkrbWcCmcADI.jpg`
	},
	'2024-oscar-nominations-for-best-picture': {
		name: '2024 Oscar Nominations for Best Picture',
		route: '2024-oscar-nominations-for-best-picture',
		id: 8304073,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg`
	},
	'2023-oscar-nominations-for-best-picture': {
		name: '2023 Oscar Nominations for Best Picture',
		route: '2023-oscar-nominations-for-best-picture',
		id: 8275755,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/ss0Os3uWJfQAENILHZUdX8Tt1OC.jpg`
	},
	'2022-oscar-nominations-for-best-picture': {
		name: '2022 Oscar Nominations for Best Picture',
		route: '2022-oscar-nominations-for-best-picture',
		id: 8275752,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/v85FlkbMYKa5du1glm0YfYNsL2n.jpg`
	},
	'2021-oscar-nominations-for-best-picture': {
		name: '2021 Oscar Nominations for Best Picture',
		route: '2021-oscar-nominations-for-best-picture',
		id: 8275750,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/bjjZXrP8PEdFeJkKERc62xlarMI.jpg`
	},
	'2020-oscar-nominations-for-best-picture': {
		name: '2020 Oscar Nominations for Best Picture',
		route: '2020-oscar-nominations-for-best-picture',
		id: 8275747,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg`
	},
	'2019-oscar-nominations-for-best-picture': {
		name: '2019 Oscar Nominations for Best Picture',
		route: '2019-oscar-nominations-for-best-picture',
		id: 8275746,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/2Xe9lISpwXKhvKiHttbFfVRERQX.jpg`
	},
	'2018-oscar-nominations-for-best-picture-90th-academy-awards': {
		name: '2018 Oscar Nominations for Best Picture -  Awards',
		route: '2018-oscar-nominations-for-best-picture-90th-academy-awards',
		id: 8275745,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/hVYhrKuQNFro6jXHZMn60uYjrIP.jpg`
	},
	'2017-oscar-nominations-for-best-picture-89th-academy-awards': {
		name: '2017 Oscar Nominations for Best Picture',
		route: '2017-oscar-nominations-for-best-picture-89th-academy-awards',
		id: 17445,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/A9KPbYTQvWsp51Lgz85ukVkFrKf.jpg`
	},
	'2016-oscar-nominations-for-best-picture-88th-academy-awards': {
		name: '2016 Oscar Nominations for Best Picture',
		route: '2016-oscar-nominations-for-best-picture-88th-academy-awards',
		id: 10291,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/hTYZ9tPvRZrL3rSf0tB38r53IG.jpg`
	},
	'2015-oscar-nominations-for-best-picture-87th-academy-awards': {
		name: '2015 Oscar Nominations for Best Picture',
		route: '2015-oscar-nominations-for-best-picture-87th-academy-awards',
		id: 10289,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/s0OrExdg7i3RLR7oqzHRk4q2kL4.jpg`
	},
	'2014-oscar-nominations-for-best-picture-86th-academy-awards': {
		name: '2014 Oscar Nominations for Best Picture',
		route: '2014-oscar-nominations-for-best-picture-86th-academy-awards',
		id: 10288,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/4Bb1kMIfrT2tYRZ9M6Jhqy6gkeF.jpg`
	},
	'2010-oscar-nominations-for-best-picture-82nd-academy-awards': {
		name: '2010 Oscar Nominations for Best Picture',
		route: '2010-oscar-nominations-for-best-picture-82nd-academy-awards',
		id: 8,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/off0xgvtfHY82l3MC4mDpCk1APY.jpg`
	},
	'2009-oscar-nominations-for-best-picture-81st-academy-awards': {
		name: '2009 Oscar Nominations for Best Picture',
		route: '2009-oscar-nominations-for-best-picture-81st-academy-awards',
		id: 9,
		backdropUrl: `${TMDB_BACKDROP_SMALL}/9IZvClXvhSxlp41eT0CyUEsyjqy.jpg`
	}
};

export const companies: Record<string, Company> = {
	a24: {
		name: 'A24',
		route: 'a24',
		id: 41077
	},
	'blumhouse-productions': {
		name: 'Blumhouse Productions',
		route: 'blumhouse-productions',
		id: 3172
	},
	'dreamworks-animation': {
		name: 'DreamWorks Animation',
		route: 'dreamworks-animation',
		id: 521
	},
	'focus-features': {
		name: 'Focus Features',
		route: 'focus-features',
		id: 10146
	},
	'fox-searchlight-pictures': {
		name: 'Fox Searchlight Pictures',
		route: 'fox-searchlight-pictures',
		id: 43
	},
	'legendary-entertainment': {
		name: 'Legendary Entertainment',
		route: 'legendary-entertainment',
		id: 923
	},
	'marvel-studios': {
		name: 'Marvel Studios',
		route: 'marvel-studios',
		id: 420
	},
	'paramount-pictures': {
		name: 'Paramount Pictures',
		route: 'paramount-pictures',
		id: 4
	},
	'pixar-animation-studios': {
		name: 'Pixar Animation Studios',
		route: 'pixar-animation-studios',
		id: 3
	},
	'sony-pictures': {
		name: 'Sony Pictures',
		route: 'sony-pictures',
		id: 34
	},
	'universal-pictures': {
		name: 'Universal Pictures',
		route: 'universal-pictures',
		id: 33
	},
	'warner-bros': {
		name: 'Warner Bros',
		route: 'warner-bros',
		id: 6194
	}
};

export const networksList = Object.values(networks);
export const collectionsList = Object.values(collections);
export const companiesList = Object.values(companies);
