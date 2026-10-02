import { TmdbSeriesFull } from './tmdb/tmdb.dto.js';

export function hasSeason(series: TmdbSeriesFull, season: number): boolean {
  return !!series.seasons?.some((s) => s.season_number === season);
}

export function hasEpisode(
  series: TmdbSeriesFull,
  season: number,
  episode: number,
): boolean {
  return !!series.seasons
    ?.find((s) => s.season_number === season)
    ?.episodes?.some((e) => e.episode_number === episode);
}
