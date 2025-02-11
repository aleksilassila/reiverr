export const ENV = process.env.NODE_ENV || 'production';
export const JWT_SECRET =
  process.env.SECRET ||
  (ENV === 'development'
    ? 'secret'
    : Math.random().toString(36).substring(2, 15));
export const TMDB_API_KEY =
  process.env.TMDB_API_KEY ||
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0YTZiMDIxZTE5Y2YxOTljMTM1NGFhMGRiMDZiOTkzMiIsInN1YiI6IjY0ODYzYWRmMDI4ZjE0MDExZTU1MDkwMiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.yyMkZlhGOGBHtw1yvpBVUUHhu7IKVYho49MvNNKt_wY';
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
export const TMDB_CACHE_TTL = Number.isNaN(Number(process.env.TMDB_CACHE_TTL))
  ? 1000 * 60 * 60 * 24 * 3 // 3 days
  : Number(process.env.TMDB_CACHE_TTL);
