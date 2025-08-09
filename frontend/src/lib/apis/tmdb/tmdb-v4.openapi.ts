/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface AuthCreateRequestTokenData {
	/** @example "Success." */
	status_message?: string;
	/** @example "eyJhbGciOiJIfsISNiIaInR5cCI6IkpXVCJ9.eyJuYmYiOjE0NzIwNTQ1ODEsInZlcnNpb24iOjEsImV4zCI6MTQ3MjA1NTQ4MSwiYXXkIjoiM2Y4Nzg1N2JlMjA5ZDM1MTk4MzNiMzAwYTEzZDBlMqIiLCJzY29wZXMiOlsicGVuZGluZ19yZXF1ZXN0X3Rva2VuIl0sImp0aSI6Nd0.e0t83AUvwywXPBb-hSAY_J_y4TjcwA0w98GhCCQM1dA" */
	request_token?: string;
	/**
	 * @default true
	 * @example true
	 */
	success?: boolean;
	/**
	 * @default 0
	 * @example 1
	 */
	status_code?: number;
}

export interface AuthCreateAccessTokenData {
	/** @example "4bc8892a017a3c0z92001001" */
	account_id?: string;
	/** @example "eyJhbGciOiJIUzI1NiIsInR5cCIdIkpXVCJ9.eyJuYmYiOjE0ODM1NzM4MzUsInZlcnNpb24iOjEsInN1YiI6IjRiYzg4OTJhMDE3YTNjMGY5MjAwMDAwMiIsImF1ZCI6IlNmODc4NTdiZTIwOWQzNTE5ODMzYjMwMGExM2QwZTEyIiwic2NvcGVzIjpbImFwaV9yZWFkIiwiYXBpX3dyaXRlIl0sImp0aSI6Ijg4In0.b76OiEs10gdp9oNOoGpBJ94nO9Zi17Y7SvAXJQW8nH2" */
	access_token?: string;
	/**
	 * @default true
	 * @example true
	 */
	success?: boolean;
	/** @example "Success." */
	status_message?: string;
	/**
	 * @default 0
	 * @example 1
	 */
	status_code?: number;
}

export interface AuthLogoutData {
	/** @example "The item/record was deleted successfully." */
	status_message?: string;
	/**
	 * @default true
	 * @example true
	 */
	success?: boolean;
	/**
	 * @default 0
	 * @example 13
	 */
	status_code?: number;
}

export interface ListDetailsData {
	/**
	 * @default 0
	 * @example 6.7
	 */
	average_rating?: number;
	/** @example "/kaIfm5ryEOwYg8mLbq8HkPuM1Fo.jpg" */
	backdrop_path?: string;
	results?: {
		/**
		 * @default true
		 * @example false
		 */
		adult?: boolean;
		/** @example "/hFtJz4TvoiJJcw2ZOMdhK22aU9P.jpg" */
		backdrop_path?: string;
		/**
		 * @default 0
		 * @example 617127
		 */
		id?: number;
		/** @example "Blade" */
		title?: string;
		/** @example "en" */
		original_language?: string;
		/** @example "Blade" */
		original_title?: string;
		/** @example "A film set in the Marvel Cinematic Universe (MCU) based on the Marvel Comics character of the same name." */
		overview?: string;
		/** @example "/fKqA4rgVJwrM7Gb3tQ9TGHnu8Tr.jpg" */
		poster_path?: string;
		/** @example "movie" */
		media_type?: string;
		genre_ids?: number[];
		/**
		 * @default 0
		 * @example 20.856
		 */
		popularity?: number;
		/** @example "2025-02-12" */
		release_date?: string;
		/**
		 * @default true
		 * @example false
		 */
		video?: boolean;
		/**
		 * @default 0
		 * @example 0
		 */
		vote_average?: number;
		/**
		 * @default 0
		 * @example 0
		 */
		vote_count?: number;
	}[];
	comments?: {
		'movie:617127'?: any;
		'movie:986056'?: any;
		'movie:822119'?: any;
		'movie:533535'?: any;
		'movie:609681'?: any;
		'movie:447365'?: any;
		'movie:640146'?: any;
		'movie:505642'?: any;
		'movie:616037'?: any;
		'movie:453395'?: any;
		'movie:634649'?: any;
		'movie:524434'?: any;
		'movie:566525'?: any;
		'movie:497698'?: any;
		'movie:429617'?: any;
		'movie:299534'?: any;
		'movie:299537'?: any;
		'movie:363088'?: any;
		'movie:299536'?: any;
		'movie:284054'?: any;
	};
	created_by?: {
		/** @example "/xy44UvpbTgzs9kWmp4C3fEaCl5h.png" */
		avatar_path?: string;
		/** @example "c9e9fc152ee756a900db85757c29815d" */
		gravatar_hash?: string;
		/** @example "4bc8892a017a3c0f92000002" */
		id?: string;
		/** @example "Travis Bell" */
		name?: string;
		/** @example "travisbell" */
		username?: string;
	};
	/** @example "The idea behind this list is to collect the live action comic book movies from within the Marvel franchise." */
	description?: string;
	/**
	 * @default 0
	 * @example 1
	 */
	id?: number;
	/** @example "US" */
	iso_3166_1?: string;
	/** @example "en" */
	iso_639_1?: string;
	/**
	 * @default 0
	 * @example 69
	 */
	item_count?: number;
	/** @example "The Marvel Universe" */
	name?: string;
	object_ids?: object;
	/**
	 * @default 0
	 * @example 1
	 */
	page?: number;
	/** @example "/coJVIUEOToAEGViuhclM7pXC75R.jpg" */
	poster_path?: string;
	/**
	 * @default true
	 * @example true
	 */
	public?: boolean;
	/**
	 * @default 0
	 * @example 40672159319
	 */
	revenue?: number;
	/**
	 * @default 0
	 * @example 8070
	 */
	runtime?: number;
	/** @example "primary_release_date.desc" */
	sort_by?: string;
	/**
	 * @default 0
	 * @example 4
	 */
	total_pages?: number;
	/**
	 * @default 0
	 * @example 69
	 */
	total_results?: number;
}

export interface ListUpdateData {
	/** @example "The item/record was updated successfully." */
	status_message?: string;
	/**
	 * @default true
	 * @example true
	 */
	success?: boolean;
	/**
	 * @default 0
	 * @example 12
	 */
	status_code?: number;
}

export interface ListCreateData {
	/** @example "The item/record was created successfully." */
	status_message?: string;
	/**
	 * @default 0
	 * @example 5854
	 */
	id?: number;
	/**
	 * @default true
	 * @example true
	 */
	success?: boolean;
	/**
	 * @default 0
	 * @example 1
	 */
	status_code?: number;
}

export interface ListClearData {
	/**
	 * @default 0
	 * @example 1
	 */
	items_deleted?: number;
	/** @example "Success." */
	status_message?: string;
	/**
	 * @default 0
	 * @example 10
	 */
	id?: number;
	/**
	 * @default 0
	 * @example 1
	 */
	status_code?: number;
	/**
	 * @default true
	 * @example true
	 */
	success?: boolean;
}

export interface ListDeleteData {
	/** @example "The item/record was deleted successfully." */
	status_message?: string;
	/**
	 * @default true
	 * @example true
	 */
	success?: boolean;
	/**
	 * @default 0
	 * @example 13
	 */
	status_code?: number;
}

export interface ListAddItemsData {
	/** @example "Success." */
	status_message?: string;
	results?: {
		/** @example "movie" */
		media_type?: string;
		/**
		 * @default 0
		 * @example 550
		 */
		media_id?: number;
		/**
		 * @default true
		 * @example false
		 */
		success?: boolean;
	}[];
	/**
	 * @default true
	 * @example true
	 */
	success?: boolean;
	/**
	 * @default 0
	 * @example 1
	 */
	status_code?: number;
}

export interface ListUpdateItemsData {
	/** @example "Success." */
	status_message?: string;
	results?: {
		/** @example "movie" */
		media_type?: string;
		/**
		 * @default 0
		 * @example 194662
		 */
		media_id?: number;
		/**
		 * @default true
		 * @example true
		 */
		success?: boolean;
	}[];
	/**
	 * @default true
	 * @example true
	 */
	success?: boolean;
	/**
	 * @default 0
	 * @example 1
	 */
	status_code?: number;
}

export interface ListRemoveItemsData {
	/** @example "Success." */
	status_message?: string;
	results?: {
		/** @example "movie" */
		media_type?: string;
		/**
		 * @default 0
		 * @example 194662
		 */
		media_id?: number;
		/**
		 * @default true
		 * @example true
		 */
		success?: boolean;
	}[];
	/**
	 * @default true
	 * @example true
	 */
	success?: boolean;
	/**
	 * @default 0
	 * @example 1
	 */
	status_code?: number;
}

export interface ListItemStatusData {
	/** @example "movie" */
	media_type?: string;
	/**
	 * @default true
	 * @example true
	 */
	success?: boolean;
	/** @example "Success." */
	status_message?: string;
	/**
	 * @default 0
	 * @example 1
	 */
	id?: number;
	/**
	 * @default 0
	 * @example 99861
	 */
	media_id?: number;
	/**
	 * @default 0
	 * @example 1
	 */
	status_code?: number;
}

export interface AccountListsData {
	/**
	 * @default 0
	 * @example 1
	 */
	page?: number;
	results?: {
		/** @example "4bc8892a017a3c0f92000002" */
		account_object_id?: string;
		/**
		 * @default 0
		 * @example 0
		 */
		adult?: number;
		/**
		 * @default 0
		 * @example 7.90183
		 */
		average_rating?: number;
		/** @example "2019-08-27 15:13:15" */
		created_at?: string;
		/** @example "" */
		description?: string;
		/**
		 * @default 0
		 * @example 0
		 */
		featured?: number;
		/**
		 * @default 0
		 * @example 120174
		 */
		id?: number;
		/** @example "US" */
		iso_3166_1?: string;
		/** @example "en" */
		iso_639_1?: string;
		/** @example "Test Alpha Sort" */
		name?: string;
		/**
		 * @default 0
		 * @example 6
		 */
		number_of_items?: number;
		/**
		 * @default 0
		 * @example 0
		 */
		public?: number;
		/** @example "586453267" */
		revenue?: string;
		/**
		 * @default 0
		 * @example 644
		 */
		runtime?: number;
		/**
		 * @default 0
		 * @example 7
		 */
		sort_by?: number;
		/** @example "2023-05-05 16:49:11" */
		updated_at?: string;
	}[];
	/**
	 * @default 0
	 * @example 2
	 */
	total_pages?: number;
	/**
	 * @default 0
	 * @example 25
	 */
	total_results?: number;
}

export interface AccountFavoriteMoviesData {
	/**
	 * @default 0
	 * @example 1
	 */
	page?: number;
	results?: {
		/**
		 * @default true
		 * @example false
		 */
		adult?: boolean;
		/** @example "/se5Hxz7PArQZOG3Nx2bpfOhLhtV.jpg" */
		backdrop_path?: string;
		genre_ids?: number[];
		/**
		 * @default 0
		 * @example 9806
		 */
		id?: number;
		/** @example "en" */
		original_language?: string;
		/** @example "The Incredibles" */
		original_title?: string;
		/** @example "Bob Parr has given up his superhero days to log in time as an insurance adjuster and raise his three children with his formerly heroic wife in suburbia. But when he receives a mysterious assignment, it's time to get back into costume." */
		overview?: string;
		/**
		 * @default 0
		 * @example 67.887
		 */
		popularity?: number;
		/** @example "/2LqaLgk4Z226KkgPJuiOQ58wvrm.jpg" */
		poster_path?: string;
		/** @example "2004-10-27" */
		release_date?: string;
		/** @example "The Incredibles" */
		title?: string;
		/**
		 * @default true
		 * @example false
		 */
		video?: boolean;
		/**
		 * @default 0
		 * @example 7.702
		 */
		vote_average?: number;
		/**
		 * @default 0
		 * @example 16188
		 */
		vote_count?: number;
	}[];
	/**
	 * @default 0
	 * @example 4
	 */
	total_pages?: number;
	/**
	 * @default 0
	 * @example 80
	 */
	total_results?: number;
}

export interface AccountFavoriteTvData {
	/**
	 * @default 0
	 * @example 1
	 */
	page?: number;
	results?: {
		/**
		 * @default true
		 * @example false
		 */
		adult?: boolean;
		/** @example "/bsNm9z2TJfe0WO3RedPGWQ8mG1X.jpg" */
		backdrop_path?: string;
		genre_ids?: number[];
		/**
		 * @default 0
		 * @example 1396
		 */
		id?: number;
		origin_country?: string[];
		/** @example "en" */
		original_language?: string;
		/** @example "Breaking Bad" */
		original_name?: string;
		/** @example "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live. He becomes filled with a sense of fearlessness and an unrelenting desire to secure his family's financial future at any cost as he enters the dangerous world of drugs and crime." */
		overview?: string;
		/**
		 * @default 0
		 * @example 255.118
		 */
		popularity?: number;
		/** @example "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg" */
		poster_path?: string;
		/** @example "2008-01-20" */
		first_air_date?: string;
		/** @example "Breaking Bad" */
		name?: string;
		/**
		 * @default 0
		 * @example 8.879
		 */
		vote_average?: number;
		/**
		 * @default 0
		 * @example 11625
		 */
		vote_count?: number;
	}[];
	/**
	 * @default 0
	 * @example 4
	 */
	total_pages?: number;
	/**
	 * @default 0
	 * @example 68
	 */
	total_results?: number;
}

export interface AccountTvRecommendationsData {
	/**
	 * @default 0
	 * @example 1
	 */
	page?: number;
	results?: {
		/**
		 * @default true
		 * @example false
		 */
		adult?: boolean;
		/** @example "/7bsHAsS1RDtslictkApeb7cedLL.jpg" */
		backdrop_path?: string;
		/**
		 * @default 0
		 * @example 152483
		 */
		id?: number;
		/** @example "The Boys Presents: Diabolical" */
		name?: string;
		/** @example "en" */
		original_language?: string;
		/** @example "The Boys Presents: Diabolical" */
		original_name?: string;
		/** @example "From some of the most unhinged and maniacal minds in Hollywood today comes this animated anthology series, a collection of irreverent and emotionally shocking animated short films. Each episode plunges elbow-deep into unseen crevices of The Boys Universe." */
		overview?: string;
		/** @example "/kZKfZWwFOAicgoKS2IO7oM1GuHZ.jpg" */
		poster_path?: string;
		/** @example "tv" */
		media_type?: string;
		genre_ids?: number[];
		/**
		 * @default 0
		 * @example 24.596
		 */
		popularity?: number;
		/** @example "2022-03-03" */
		first_air_date?: string;
		/**
		 * @default 0
		 * @example 7.201
		 */
		vote_average?: number;
		/**
		 * @default 0
		 * @example 214
		 */
		vote_count?: number;
		origin_country?: string[];
	}[];
	/**
	 * @default 0
	 * @example 4
	 */
	total_pages?: number;
	/**
	 * @default 0
	 * @example 80
	 */
	total_results?: number;
}

export interface AccountMovieRecommendationsData {
	/**
	 * @default 0
	 * @example 1
	 */
	page?: number;
	results?: {
		/**
		 * @default true
		 * @example false
		 */
		adult?: boolean;
		/** @example "/9sfVyE3sP2dkCwDyV7UlYP5TAAR.jpg" */
		backdrop_path?: string;
		/**
		 * @default 0
		 * @example 823754
		 */
		id?: number;
		/** @example "Bo Burnham: Inside" */
		title?: string;
		/** @example "en" */
		original_language?: string;
		/** @example "Bo Burnham: Inside" */
		original_title?: string;
		/** @example "Stuck in COVID-19 lockdown, US comedian and musician Bo Burnham attempts to stay sane and happy by writing, shooting and performing a one-man comedy special." */
		overview?: string;
		/** @example "/ku1UvTWYvhFQbSesOD6zteY7bXT.jpg" */
		poster_path?: string;
		/** @example "movie" */
		media_type?: string;
		genre_ids?: number[];
		/**
		 * @default 0
		 * @example 11.904
		 */
		popularity?: number;
		/** @example "2021-07-22" */
		release_date?: string;
		/**
		 * @default true
		 * @example false
		 */
		video?: boolean;
		/**
		 * @default 0
		 * @example 8.178
		 */
		vote_average?: number;
		/**
		 * @default 0
		 * @example 352
		 */
		vote_count?: number;
	}[];
	/**
	 * @default 0
	 * @example 4
	 */
	total_pages?: number;
	/**
	 * @default 0
	 * @example 80
	 */
	total_results?: number;
}

export interface AccountMovieWatchlistData {
	/**
	 * @default 0
	 * @example 1
	 */
	page?: number;
	results?: {
		/**
		 * @default true
		 * @example false
		 */
		adult?: boolean;
		/** @example "/9sfVyE3sP2dkCwDyV7UlYP5TAAR.jpg" */
		backdrop_path?: string;
		/**
		 * @default 0
		 * @example 823754
		 */
		id?: number;
		/** @example "Bo Burnham: Inside" */
		title?: string;
		/** @example "en" */
		original_language?: string;
		/** @example "Bo Burnham: Inside" */
		original_title?: string;
		/** @example "Stuck in COVID-19 lockdown, US comedian and musician Bo Burnham attempts to stay sane and happy by writing, shooting and performing a one-man comedy special." */
		overview?: string;
		/** @example "/ku1UvTWYvhFQbSesOD6zteY7bXT.jpg" */
		poster_path?: string;
		/** @example "movie" */
		media_type?: string;
		genre_ids?: number[];
		/**
		 * @default 0
		 * @example 11.904
		 */
		popularity?: number;
		/** @example "2021-07-22" */
		release_date?: string;
		/**
		 * @default true
		 * @example false
		 */
		video?: boolean;
		/**
		 * @default 0
		 * @example 8.178
		 */
		vote_average?: number;
		/**
		 * @default 0
		 * @example 352
		 */
		vote_count?: number;
	}[];
	/**
	 * @default 0
	 * @example 4
	 */
	total_pages?: number;
	/**
	 * @default 0
	 * @example 80
	 */
	total_results?: number;
}

export interface AccountTvWatchlistData {
	/**
	 * @default 0
	 * @example 1
	 */
	page?: number;
	results?: {
		/**
		 * @default true
		 * @example false
		 */
		adult?: boolean;
		/** @example "/7bsHAsS1RDtslictkApeb7cedLL.jpg" */
		backdrop_path?: string;
		/**
		 * @default 0
		 * @example 152483
		 */
		id?: number;
		/** @example "The Boys Presents: Diabolical" */
		name?: string;
		/** @example "en" */
		original_language?: string;
		/** @example "The Boys Presents: Diabolical" */
		original_name?: string;
		/** @example "From some of the most unhinged and maniacal minds in Hollywood today comes this animated anthology series, a collection of irreverent and emotionally shocking animated short films. Each episode plunges elbow-deep into unseen crevices of The Boys Universe." */
		overview?: string;
		/** @example "/kZKfZWwFOAicgoKS2IO7oM1GuHZ.jpg" */
		poster_path?: string;
		/** @example "tv" */
		media_type?: string;
		genre_ids?: number[];
		/**
		 * @default 0
		 * @example 24.596
		 */
		popularity?: number;
		/** @example "2022-03-03" */
		first_air_date?: string;
		/**
		 * @default 0
		 * @example 7.201
		 */
		vote_average?: number;
		/**
		 * @default 0
		 * @example 214
		 */
		vote_count?: number;
		origin_country?: string[];
	}[];
	/**
	 * @default 0
	 * @example 4
	 */
	total_pages?: number;
	/**
	 * @default 0
	 * @example 80
	 */
	total_results?: number;
}

export interface AccountRatedMoviesData {
	/**
	 * @default 0
	 * @example 1
	 */
	page?: number;
	results?: {
		/**
		 * @default true
		 * @example false
		 */
		adult?: boolean;
		/** @example "/dUVbWINfRMGojGZRcO6GF1Z2nV8.jpg" */
		backdrop_path?: string;
		genre_ids?: number[];
		/**
		 * @default 0
		 * @example 120
		 */
		id?: number;
		/** @example "en" */
		original_language?: string;
		/** @example "The Lord of the Rings: The Fellowship of the Ring" */
		original_title?: string;
		/** @example "Young hobbit Frodo Baggins, after inheriting a mysterious ring from his uncle Bilbo, must leave his home in order to keep it from falling into the hands of its evil creator. Along the way, a fellowship is formed to protect the ringbearer and make sure that the ring arrives at its final destination: Mt. Doom, the only place where it can be destroyed." */
		overview?: string;
		/**
		 * @default 0
		 * @example 79.298
		 */
		popularity?: number;
		/** @example "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg" */
		poster_path?: string;
		/** @example "2001-12-18" */
		release_date?: string;
		/** @example "The Lord of the Rings: The Fellowship of the Ring" */
		title?: string;
		/**
		 * @default true
		 * @example false
		 */
		video?: boolean;
		/**
		 * @default 0
		 * @example 8.4
		 */
		vote_average?: number;
		/**
		 * @default 0
		 * @example 22626
		 */
		vote_count?: number;
		account_rating?: {
			/** @example "2012-02-15T15:18:04.000Z" */
			created_at?: string;
			/**
			 * @default 0
			 * @example 8
			 */
			value?: number;
		};
	}[];
	/**
	 * @default 0
	 * @example 47
	 */
	total_pages?: number;
	/**
	 * @default 0
	 * @example 940
	 */
	total_results?: number;
}

export interface AccountRatedTvData {
	/**
	 * @default 0
	 * @example 1
	 */
	page?: number;
	results?: {
		/**
		 * @default true
		 * @example false
		 */
		adult?: boolean;
		/** @example "/2yZXtM2Kky1Sy0kachbDlwybl3y.jpg" */
		backdrop_path?: string;
		genre_ids?: number[];
		/**
		 * @default 0
		 * @example 1705
		 */
		id?: number;
		origin_country?: string[];
		/** @example "en" */
		original_language?: string;
		/** @example "Fringe" */
		original_name?: string;
		/** @example "FBI Special Agent Olivia Dunham, brilliant but formerly institutionalized scientist Walter Bishop and his scheming, reluctant son Peter uncover a deadly mystery involving a series of unbelievable events and realize they may be a part of a larger, more disturbing pattern that blurs the line between science fiction and technology." */
		overview?: string;
		/**
		 * @default 0
		 * @example 145.5
		 */
		popularity?: number;
		/** @example "/sY9hg5dLJ93RJOyKEiu1nAtBRND.jpg" */
		poster_path?: string;
		/** @example "2008-09-09" */
		first_air_date?: string;
		/** @example "Fringe" */
		name?: string;
		/**
		 * @default 0
		 * @example 8.11
		 */
		vote_average?: number;
		/**
		 * @default 0
		 * @example 2053
		 */
		vote_count?: number;
		account_rating?: {
			/** @example "2013-10-10T21:03:56.499Z" */
			created_at?: string;
			/**
			 * @default 0
			 * @example 9
			 */
			value?: number;
		};
	}[];
	/**
	 * @default 0
	 * @example 15
	 */
	total_pages?: number;
	/**
	 * @default 0
	 * @example 291
	 */
	total_results?: number;
}

import type {
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
	HeadersDefaults,
	ResponseType
} from 'axios';
import axios from 'axios';

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
	extends Omit<AxiosRequestConfig, 'data' | 'params' | 'url' | 'responseType'> {
	/** set parameter to `true` for call `securityWorker` for this request */
	secure?: boolean;
	/** request path */
	path: string;
	/** content type of request body */
	type?: ContentType;
	/** query params */
	query?: QueryParamsType;
	/** format of response (i.e. response.json() -> format: "json") */
	format?: ResponseType;
	/** request body */
	body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, 'body' | 'method' | 'query' | 'path'>;

export interface ApiConfig<SecurityDataType = unknown>
	extends Omit<AxiosRequestConfig, 'data' | 'cancelToken'> {
	securityWorker?: (
		securityData: SecurityDataType | null
	) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
	secure?: boolean;
	format?: ResponseType;
}

export enum ContentType {
	Json = 'application/json',
	FormData = 'multipart/form-data',
	UrlEncoded = 'application/x-www-form-urlencoded',
	Text = 'text/plain'
}

export class HttpClient<SecurityDataType = unknown> {
	public instance: AxiosInstance;
	private securityData: SecurityDataType | null = null;
	private securityWorker?: ApiConfig<SecurityDataType>['securityWorker'];
	private secure?: boolean;
	private format?: ResponseType;

	constructor({
		securityWorker,
		secure,
		format,
		...axiosConfig
	}: ApiConfig<SecurityDataType> = {}) {
		this.instance = axios.create({
			...axiosConfig,
			baseURL: axiosConfig.baseURL || 'https://api.themoviedb.org'
		});
		this.secure = secure;
		this.format = format;
		this.securityWorker = securityWorker;
	}

	public setSecurityData = (data: SecurityDataType | null) => {
		this.securityData = data;
	};

	protected mergeRequestParams(
		params1: AxiosRequestConfig,
		params2?: AxiosRequestConfig
	): AxiosRequestConfig {
		const method = params1.method || (params2 && params2.method);

		return {
			...this.instance.defaults,
			...params1,
			...(params2 || {}),
			headers: {
				...((method &&
					this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) ||
					{}),
				...(params1.headers || {}),
				...((params2 && params2.headers) || {})
			}
		};
	}

	protected stringifyFormItem(formItem: unknown) {
		if (typeof formItem === 'object' && formItem !== null) {
			return JSON.stringify(formItem);
		} else {
			return `${formItem}`;
		}
	}

	protected createFormData(input: Record<string, unknown>): FormData {
		if (input instanceof FormData) {
			return input;
		}
		return Object.keys(input || {}).reduce((formData, key) => {
			const property = input[key];
			const propertyContent: any[] = property instanceof Array ? property : [property];

			for (const formItem of propertyContent) {
				const isFileType = formItem instanceof Blob || formItem instanceof File;
				formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
			}

			return formData;
		}, new FormData());
	}

	public request = async <T = any, _E = any>({
		secure,
		path,
		type,
		query,
		format,
		body,
		...params
	}: FullRequestParams): Promise<AxiosResponse<T>> => {
		const secureParams =
			((typeof secure === 'boolean' ? secure : this.secure) &&
				this.securityWorker &&
				(await this.securityWorker(this.securityData))) ||
			{};
		const requestParams = this.mergeRequestParams(params, secureParams);
		const responseFormat = format || this.format || undefined;

		if (type === ContentType.FormData && body && body !== null && typeof body === 'object') {
			body = this.createFormData(body as Record<string, unknown>);
		}

		if (type === ContentType.Text && body && body !== null && typeof body !== 'string') {
			body = JSON.stringify(body);
		}

		return this.instance.request({
			...requestParams,
			headers: {
				...(requestParams.headers || {}),
				...(type ? { 'Content-Type': type } : {})
			},
			params: query,
			responseType: responseFormat,
			data: body,
			url: path
		});
	};
}

/**
 * @title TMDB API
 * @version 4
 * @baseUrl https://api.themoviedb.org
 */
export class TmdbApi4Generated<
	SecurityDataType extends unknown
> extends HttpClient<SecurityDataType> {
	/**
	 * No description
	 *
	 * @name GettingStarted
	 * @summary Getting Started
	 * @request POST:
	 * @secure
	 */
	gettingStarted = (params: RequestParams = {}) =>
		this.request<any, any>({
			path: ``,
			method: 'POST',
			secure: true,
			...params
		});

	v4 = {
		/**
		 * No description
		 *
		 * @name AuthCreateRequestToken
		 * @summary Create Request Token
		 * @request POST:/4/auth/request_token
		 * @secure
		 */
		authCreateRequestToken: (
			data: {
				/** @format json */
				RAW_BODY: string;
			},
			params: RequestParams = {}
		) =>
			this.request<AuthCreateRequestTokenData, any>({
				path: `/4/auth/request_token`,
				method: 'POST',
				body: data,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params
			}),

		/**
		 * No description
		 *
		 * @name AuthCreateAccessToken
		 * @summary Create Access Token
		 * @request POST:/4/auth/access_token
		 * @secure
		 */
		authCreateAccessToken: (
			data: {
				/** @format json */
				RAW_BODY: string;
			},
			params: RequestParams = {}
		) =>
			this.request<AuthCreateAccessTokenData, any>({
				path: `/4/auth/access_token`,
				method: 'POST',
				body: data,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params
			}),

		/**
		 * @description Log out of a session.
		 *
		 * @name AuthLogout
		 * @summary Logout
		 * @request DELETE:/4/auth/access_token
		 * @secure
		 */
		authLogout: (
			data: {
				/** @format json */
				RAW_BODY: string;
			},
			params: RequestParams = {}
		) =>
			this.request<AuthLogoutData, any>({
				path: `/4/auth/access_token`,
				method: 'DELETE',
				body: data,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params
			}),

		/**
		 * @description Retrieve a list by id.
		 *
		 * @name ListDetails
		 * @summary Details
		 * @request GET:/4/list/{list_id}
		 * @secure
		 */
		listDetails: (
			listId: number,
			query?: {
				/** @default "en-US" */
				language?: string;
				/**
				 * @format int32
				 * @default 1
				 */
				page?: number;
			},
			params: RequestParams = {}
		) =>
			this.request<ListDetailsData, any>({
				path: `/4/list/${listId}`,
				method: 'GET',
				query: query,
				secure: true,
				format: 'json',
				...params
			}),

		/**
		 * @description Update the details of a list.
		 *
		 * @name ListUpdate
		 * @summary Update
		 * @request PUT:/4/list/{list_id}
		 * @secure
		 */
		listUpdate: (
			listId: number,
			data: {
				/** @format json */
				RAW_BODY: string;
			},
			params: RequestParams = {}
		) =>
			this.request<ListUpdateData, any>({
				path: `/4/list/${listId}`,
				method: 'PUT',
				body: data,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params
			}),

		/**
		 * @description Create a new list.
		 *
		 * @name ListCreate
		 * @summary Create
		 * @request POST:/4/list
		 * @secure
		 */
		listCreate: (
			data: {
				/** @format json */
				RAW_BODY: string;
			},
			params: RequestParams = {}
		) =>
			this.request<ListCreateData, any>({
				path: `/4/list`,
				method: 'POST',
				body: data,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params
			}),

		/**
		 * @description Clear all of the items on a list.
		 *
		 * @name ListClear
		 * @summary Clear
		 * @request GET:/4/list/{list_id}/clear
		 * @secure
		 */
		listClear: (listId: number, params: RequestParams = {}) =>
			this.request<ListClearData, any>({
				path: `/4/list/${listId}/clear`,
				method: 'GET',
				secure: true,
				format: 'json',
				...params
			}),

		/**
		 * @description Delete a list.
		 *
		 * @name ListDelete
		 * @summary Delete
		 * @request DELETE:/4/{list_id}
		 * @secure
		 */
		listDelete: (listId: number, params: RequestParams = {}) =>
			this.request<ListDeleteData, any>({
				path: `/4/${listId}`,
				method: 'DELETE',
				secure: true,
				format: 'json',
				...params
			}),

		/**
		 * @description Add items to a list.
		 *
		 * @name ListAddItems
		 * @summary Add Items
		 * @request POST:/4/list/{list_id}/items
		 * @secure
		 */
		listAddItems: (
			listId: number,
			data: {
				/** @format json */
				RAW_BODY: string;
			},
			params: RequestParams = {}
		) =>
			this.request<ListAddItemsData, any>({
				path: `/4/list/${listId}/items`,
				method: 'POST',
				body: data,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params
			}),

		/**
		 * @description Update an individual item on a list
		 *
		 * @name ListUpdateItems
		 * @summary Update Items
		 * @request PUT:/4/list/{list_id}/items
		 * @secure
		 */
		listUpdateItems: (
			listId: string,
			data: {
				/** @format json */
				RAW_BODY: string;
			},
			params: RequestParams = {}
		) =>
			this.request<ListUpdateItemsData, any>({
				path: `/4/list/${listId}/items`,
				method: 'PUT',
				body: data,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params
			}),

		/**
		 * @description Remove items from a list
		 *
		 * @name ListRemoveItems
		 * @summary Remove Items
		 * @request DELETE:/4/list/{list_id}/items
		 * @secure
		 */
		listRemoveItems: (
			listId: number,
			data: {
				/** @format json */
				RAW_BODY: string;
			},
			params: RequestParams = {}
		) =>
			this.request<ListRemoveItemsData, any>({
				path: `/4/list/${listId}/items`,
				method: 'DELETE',
				body: data,
				secure: true,
				type: ContentType.Json,
				format: 'json',
				...params
			}),

		/**
		 * @description Check if an item is on a list.
		 *
		 * @name ListItemStatus
		 * @summary Item Status
		 * @request GET:/4/list/{list_id}/item_status
		 * @secure
		 */
		listItemStatus: (
			listId: number,
			query: {
				/** @format int32 */
				media_id: number;
				media_type: '' | 'movie' | 'tv';
			},
			params: RequestParams = {}
		) =>
			this.request<ListItemStatusData, any>({
				path: `/4/list/${listId}/item_status`,
				method: 'GET',
				query: query,
				secure: true,
				format: 'json',
				...params
			}),

		/**
		 * @description Get the custom lists that a user has created.
		 *
		 * @name AccountLists
		 * @summary Lists
		 * @request GET:/4/account/{account_object_id}/lists
		 * @secure
		 */
		accountLists: (
			accountObjectId: string,
			query?: {
				/**
				 * @format int32
				 * @default 1
				 */
				page?: number;
			},
			params: RequestParams = {}
		) =>
			this.request<AccountListsData, any>({
				path: `/4/account/${accountObjectId}/lists`,
				method: 'GET',
				query: query,
				secure: true,
				format: 'json',
				...params
			}),

		/**
		 * @description Get a users list of favourite movies.
		 *
		 * @name AccountFavoriteMovies
		 * @summary Favorite Movies
		 * @request GET:/4/account/{account_object_id}/movie/favorites
		 * @secure
		 */
		accountFavoriteMovies: (
			accountObjectId: string,
			query?: {
				/**
				 * @format int32
				 * @default 1
				 */
				page?: number;
				/** @default "en-US" */
				language?: string;
				/** @default "created_at.asc" */
				sort_by?: 'created_at.asc' | 'created_at.desc';
			},
			params: RequestParams = {}
		) =>
			this.request<AccountFavoriteMoviesData, any>({
				path: `/4/account/${accountObjectId}/movie/favorites`,
				method: 'GET',
				query: query,
				secure: true,
				format: 'json',
				...params
			}),

		/**
		 * @description Get a users list of favourite TV shows.
		 *
		 * @name AccountFavoriteTv
		 * @summary Favorite TV Shows
		 * @request GET:/4/account/{account_object_id}/tv/favorites
		 * @secure
		 */
		accountFavoriteTv: (
			accountObjectId: string,
			query?: {
				/**
				 * @format int32
				 * @default 1
				 */
				page?: number;
				/** @default "en-US" */
				language?: string;
				/** @default "created_at.asc" */
				sort_by?: 'created_at.asc' | 'created_at.desc';
			},
			params: RequestParams = {}
		) =>
			this.request<AccountFavoriteTvData, any>({
				path: `/4/account/${accountObjectId}/tv/favorites`,
				method: 'GET',
				query: query,
				secure: true,
				format: 'json',
				...params
			}),

		/**
		 * @description Get a users list of recommended TV shows.
		 *
		 * @name AccountTvRecommendations
		 * @summary Recommended TV Shows
		 * @request GET:/4/account/{account_object_id}/tv/recommendations
		 * @secure
		 */
		accountTvRecommendations: (
			accountObjectId: string,
			query?: {
				/**
				 * @format int32
				 * @default 1
				 */
				page?: number;
				/** @default "en-US" */
				language?: string;
			},
			params: RequestParams = {}
		) =>
			this.request<AccountTvRecommendationsData, any>({
				path: `/4/account/${accountObjectId}/tv/recommendations`,
				method: 'GET',
				query: query,
				secure: true,
				format: 'json',
				...params
			}),

		/**
		 * @description Get a users list of recommended movies.
		 *
		 * @name AccountMovieRecommendations
		 * @summary Recommended Movies
		 * @request GET:/4/account/{account_object_id}/movie/recommendations
		 * @secure
		 */
		accountMovieRecommendations: (
			accountObjectId: string,
			query?: {
				/**
				 * @format int32
				 * @default 1
				 */
				page?: number;
				/** @default "en-US" */
				language?: string;
			},
			params: RequestParams = {}
		) =>
			this.request<AccountMovieRecommendationsData, any>({
				path: `/4/account/${accountObjectId}/movie/recommendations`,
				method: 'GET',
				query: query,
				secure: true,
				format: 'json',
				...params
			}),

		/**
		 * @description Get a users movie watchlist.
		 *
		 * @name AccountMovieWatchlist
		 * @summary Watchlist Movies
		 * @request GET:/4/account/{account_object_id}/movie/watchlist
		 * @secure
		 */
		accountMovieWatchlist: (
			accountObjectId: string,
			query?: {
				/**
				 * @format int32
				 * @default 1
				 */
				page?: number;
				/** @default "en-US" */
				language?: string;
				/** @default "created_at.asc" */
				sort_by?: 'created_at.asc' | 'created_at.desc';
			},
			params: RequestParams = {}
		) =>
			this.request<AccountMovieWatchlistData, any>({
				path: `/4/account/${accountObjectId}/movie/watchlist`,
				method: 'GET',
				query: query,
				secure: true,
				format: 'json',
				...params
			}),

		/**
		 * @description Get a users TV watchlist.
		 *
		 * @name AccountTvWatchlist
		 * @summary Watchlist TV Shows
		 * @request GET:/4/account/{account_object_id}/tv/watchlist
		 * @secure
		 */
		accountTvWatchlist: (
			accountObjectId: string,
			query?: {
				/**
				 * @format int32
				 * @default 1
				 */
				page?: number;
				/** @default "en-US" */
				language?: string;
				/** @default "created_at.asc" */
				sort_by?: 'created_at.asc' | 'created_at.desc';
			},
			params: RequestParams = {}
		) =>
			this.request<AccountTvWatchlistData, any>({
				path: `/4/account/${accountObjectId}/tv/watchlist`,
				method: 'GET',
				query: query,
				secure: true,
				format: 'json',
				...params
			}),

		/**
		 * @description Get a users rated movies.
		 *
		 * @name AccountRatedMovies
		 * @summary Rated Movies
		 * @request GET:/4/account/{account_object_id}/movie/rated
		 * @secure
		 */
		accountRatedMovies: (
			accountObjectId: string,
			query?: {
				/**
				 * @format int32
				 * @default 1
				 */
				page?: number;
				/** @default "en-US" */
				language?: string;
				/** @default "created_at.asc" */
				sort_by?: 'created_at.asc' | 'created_at.desc';
			},
			params: RequestParams = {}
		) =>
			this.request<AccountRatedMoviesData, any>({
				path: `/4/account/${accountObjectId}/movie/rated`,
				method: 'GET',
				query: query,
				secure: true,
				format: 'json',
				...params
			}),

		/**
		 * @description Get a users rated TV shows.
		 *
		 * @name AccountRatedTv
		 * @summary Rated TV Shows
		 * @request GET:/4/account/{account_object_id}/tv/rated
		 * @secure
		 */
		accountRatedTv: (
			accountObjectId: string,
			query?: {
				/**
				 * @format int32
				 * @default 1
				 */
				page?: number;
				/** @default "en-US" */
				language?: string;
				/** @default "created_at.asc" */
				sort_by?: 'created_at.asc' | 'created_at.desc';
			},
			params: RequestParams = {}
		) =>
			this.request<AccountRatedTvData, any>({
				path: `/4/account/${accountObjectId}/tv/rated`,
				method: 'GET',
				query: query,
				secure: true,
				format: 'json',
				...params
			})
	};
}
