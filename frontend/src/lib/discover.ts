export interface Network {
	name: string;
	tmdbNetworkId: number;
}

export const networks: Record<string, Network> = {
	netflix: {
		name: 'netflix',
		tmdbNetworkId: 213
	},
	disney: {
		name: 'disney',
		tmdbNetworkId: 2739
	},
	hbo: {
		name: 'hbo',
		tmdbNetworkId: 49
	},
	hulu: {
		name: 'hulu',
		tmdbNetworkId: 453
	},
	amazon: {
		name: 'amazon',
		tmdbNetworkId: 1024
	},
	apple: {
		name: 'apple',
		tmdbNetworkId: 2552
	}
};

export interface Genre {
	name: string;
	tmdbGenreId: number;
}

export const genres: Record<string, Genre> = {
	action: {
		name: 'action',
		tmdbGenreId: 28
	},
	adventure: {
		name: 'adventure',
		tmdbGenreId: 12
	},
	animation: {
		name: 'animation',
		tmdbGenreId: 16
	},
	comedy: {
		name: 'comedy',
		tmdbGenreId: 35
	},
	crime: {
		name: 'crime',
		tmdbGenreId: 80
	}
	// Remove until pictures added
	// documentary: {
	// 	name: 'documentary',
	// 	tmdbGenreId: 99
	// },
	// drama: {
	// 	name: 'drama',
	// 	tmdbGenreId: 18
	// },
	// family: {
	// 	name: 'family',
	// 	tmdbGenreId: 10751
	// },
	// fantasy: {
	// 	name: 'fantasy',
	// 	tmdbGenreId: 14
	// },
	// history: {
	// 	name: 'history',
	// 	tmdbGenreId: 36
	// },
	// horror: {
	// 	name: 'horror',
	// 	tmdbGenreId: 27
	// },
	// music: {
	// 	name: 'music',
	// 	tmdbGenreId: 10402
	// },
	// mystery: {
	// 	name: 'mystery',
	// 	tmdbGenreId: 9648
	// },
	// romance: {
	// 	name: 'romance',
	// 	tmdbGenreId: 10749
	// },
	// scienceFiction: {
	// 	name: 'scienceFiction',
	// 	tmdbGenreId: 878
	// },
	// tvMovie: {
	// 	name: 'tvMovie',
	// 	tmdbGenreId: 10770
	// },
	// thriller: {
	// 	name: 'thriller',
	// 	tmdbGenreId: 53
	// },
	// war: {
	// 	name: 'war',
	// 	tmdbGenreId: 10752
	// },
	// western: {
	// 	name: 'western',
	// 	tmdbGenreId: 37
	// }
};
