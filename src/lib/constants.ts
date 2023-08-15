import { env } from '$env/dynamic/public';

export const TMDB_API_KEY =
	'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0YTZiMDIxZTE5Y2YxOTljMTM1NGFhMGRiMDZiOTkzMiIsInN1YiI6IjY0ODYzYWRmMDI4ZjE0MDExZTU1MDkwMiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.yyMkZlhGOGBHtw1yvpBVUUHhu7IKVYho49MvNNKt_wY';
export const TMDB_IMAGES_ORIGINAL = 'https://www.themoviedb.org/t/p/original';
export const TMDB_BACKDROP_SMALL = 'https://www.themoviedb.org/t/p/w780';
export const TMDB_POSTER_SMALL = 'https://www.themoviedb.org/t/p/w342';
export const TMDB_PROFILE_SMALL = 'https://www.themoviedb.org/t/p/w185';

export const RADARR_API_KEY = env.PUBLIC_RADARR_API_KEY;
export const RADARR_BASE_URL = env.PUBLIC_RADARR_BASE_URL;

export const SONARR_API_KEY = env.PUBLIC_SONARR_API_KEY;
export const SONARR_BASE_URL = env.PUBLIC_SONARR_BASE_URL;

export const JELLYFIN_API_KEY = env.PUBLIC_JELLYFIN_API_KEY;
export const JELLYFIN_BASE_URL = env.PUBLIC_JELLYFIN_URL || env.PUBLIC_JELLYFIN_BASE_URL; // Backwards compatibility
export const JELLYFIN_USER_ID = env.PUBLIC_JELLYFIN_USER_ID;
