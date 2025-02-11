import { TMDB_API_KEY } from 'src/consts';
import { Api } from './tmdb.v3.openapi';

export const TMDB_API = 'TMDB_API_V3';
export const TMDB_API_V4 = 'TMDB_API_V4';

export type TmdbApi = Api<object>;

export const tmdbProviders = [
  {
    provide: TMDB_API,
    useFactory: async () => {
      return new Api({
        baseURL: 'https://api.themoviedb.org',
        headers: {
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      });
    },
  },
];
