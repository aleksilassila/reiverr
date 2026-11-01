import { MediaType } from '../common/common.dto.js';
import { TmdbMovieFull, TmdbSeriesFull } from '../metadata/tmdb/tmdb.dto.js';

/** What a user would watch next of a title, with when it aired or airs (null: not yet) */
export type NextEpisode = {
  season: number;
  episode: number;
  airDate: Date | null;
};

/** The cached document of a title */
export type TitleDocument =
  | { mediaType: MediaType.Movie; movie: TmdbMovieFull }
  | { mediaType: MediaType.Series; series: TmdbSeriesFull };

type WatchedEpisode = {
  season: number;
  episode: number;
  watched: boolean;
  watchedAt?: Date | null;
};

/** What the user with the play states would watch next of the title */
export function nextOf(
  document: TitleDocument,
  playStates: WatchedEpisode[],
): NextEpisode | null {
  return document.mediaType === MediaType.Movie
    ? nextOfMovie(
        document.movie,
        playStates.find((state) => state.season === 0 && state.episode === 0),
      )
    : nextEpisodeOf(document.series, playStates);
}

/**
 * The first unwatched episode after the one watched last, in the watch
 * order of the series: the seasons from 1 up in season and episode order;
 * specials are outside it. An episode watched before the time was stored
 * counts as watched long ago, and of episodes watched at once the furthest
 * is the last. Null when there is none
 */
export function nextEpisodeOf(
  series: TmdbSeriesFull,
  playStates: WatchedEpisode[],
): NextEpisode | null {
  const watched = playStates.filter(
    (state) => state.watched && state.season >= 1,
  );
  const last = watched
    .sort(
      (a, b) =>
        timeOf(a) - timeOf(b) || a.season - b.season || a.episode - b.episode,
    )
    .pop();
  const isWatched = (season: number, episode: number) =>
    watched.some(
      (state) => state.season === season && state.episode === episode,
    );
  const seasons = (series.seasons ?? [])
    .filter((season) => (season.season_number ?? 0) >= 1)
    .sort((a, b) => (a.season_number ?? 0) - (b.season_number ?? 0));

  for (const season of seasons) {
    const number = season.season_number ?? 0;
    const episodes = [...(season.episodes ?? [])].sort(
      (a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0),
    );
    for (const episode of episodes) {
      const episodeNumber = episode.episode_number ?? 0;
      const isAfterLast =
        !last ||
        number > last.season ||
        (number === last.season && episodeNumber > last.episode);
      if (isAfterLast && !isWatched(number, episodeNumber)) {
        return {
          season: number,
          episode: episodeNumber,
          airDate: episode.air_date ? new Date(episode.air_date) : null,
        };
      }
    }
  }

  return null;
}

const timeOf = (state: WatchedEpisode) => state.watchedAt?.getTime() ?? 0;

/**
 * The movie itself, at season 0 and episode 0 as its play state is keyed,
 * while it is not watched. A movie without a release date counts as
 * released
 */
export function nextOfMovie(
  movie: TmdbMovieFull,
  playState: { watched: boolean } | undefined,
): NextEpisode | null {
  if (playState?.watched) return null;

  return {
    season: 0,
    episode: 0,
    airDate: movie.release_date ? new Date(movie.release_date) : new Date(0),
  };
}
