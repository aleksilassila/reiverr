export type Network = {
	name: string;
	tmdbNetworkId: number;
};

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
