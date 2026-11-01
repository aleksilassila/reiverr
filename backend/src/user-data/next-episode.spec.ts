import { MediaType } from '../common/common.dto.js';
import { TmdbMovieFull, TmdbSeriesFull } from '../metadata/tmdb/tmdb.dto.js';
import { nextEpisodeOf, nextOf, nextOfMovie } from './next-episode.js';

const SERIES = {
  seasons: [
    {
      season_number: 0,
      episodes: [{ episode_number: 1, air_date: '2019-12-25' }],
    },
    // Out of order, as TMDB may list them
    {
      season_number: 2,
      episodes: [
        { episode_number: 2, air_date: '2021-01-08' },
        { episode_number: 1 },
      ],
    },
    {
      season_number: 1,
      episodes: [
        { episode_number: 1, air_date: '2020-01-01' },
        { episode_number: 2, air_date: '2020-01-08' },
      ],
    },
  ],
} as TmdbSeriesFull;

const watched = (season: number, episode: number, at?: string) => ({
  season,
  episode,
  watched: true,
  watchedAt: at ? new Date(at) : null,
});

describe('nextEpisodeOf', () => {
  it('starts from the first episode', () => {
    expect(nextEpisodeOf(SERIES, [])).toEqual({
      season: 1,
      episode: 1,
      airDate: new Date('2020-01-01'),
    });
  });

  it('steps past the last watched episode, across seasons', () => {
    expect(nextEpisodeOf(SERIES, [watched(1, 1)])).toMatchObject({
      season: 1,
      episode: 2,
    });
    expect(nextEpisodeOf(SERIES, [watched(1, 2)])).toEqual({
      season: 2,
      episode: 1,
      airDate: null,
    });
  });

  it('goes by the episode watched last, and skips the watched ones after it', () => {
    expect(
      nextEpisodeOf(SERIES, [
        watched(2, 2, '2026-01-01'),
        watched(1, 1, '2026-02-01'),
      ]),
    ).toMatchObject({ season: 1, episode: 2 });
    expect(
      nextEpisodeOf(SERIES, [
        watched(1, 2, '2026-01-01'),
        watched(1, 1, '2026-02-01'),
      ]),
    ).toMatchObject({ season: 2, episode: 1 });
  });

  it('counts an episode watched without a time as watched long ago', () => {
    expect(
      nextEpisodeOf(SERIES, [watched(2, 2), watched(1, 1, '2026-02-01')]),
    ).toMatchObject({ season: 1, episode: 2 });
  });

  it('takes the furthest of the episodes watched at once', () => {
    expect(
      nextEpisodeOf(SERIES, [
        watched(1, 2, '2026-01-01'),
        watched(1, 1, '2026-01-01'),
      ]),
    ).toMatchObject({ season: 2, episode: 1 });
    expect(nextEpisodeOf(SERIES, [watched(2, 1), watched(1, 1)])).toMatchObject(
      { season: 2, episode: 2 },
    );
  });

  it('has nothing after the last episode', () => {
    expect(nextEpisodeOf(SERIES, [watched(2, 2)])).toBeNull();
    expect(
      nextEpisodeOf(SERIES, [
        watched(1, 1, '2026-01-01'),
        watched(2, 2, '2026-02-01'),
      ]),
    ).toBeNull();
  });

  it('leaves specials out, watched or not', () => {
    expect(nextEpisodeOf(SERIES, [watched(0, 1, '2026-02-01')])).toMatchObject({
      season: 1,
      episode: 1,
    });
    expect(
      nextEpisodeOf(SERIES, [
        watched(1, 1),
        { season: 1, episode: 2, watched: false },
      ]),
    ).toMatchObject({ season: 1, episode: 2 });
  });
});

describe('nextOfMovie', () => {
  const movie = { release_date: '2020-06-01' } as TmdbMovieFull;

  it('is the movie itself until it is watched', () => {
    expect(nextOfMovie(movie, undefined)).toEqual({
      season: 0,
      episode: 0,
      airDate: new Date('2020-06-01'),
    });
    expect(nextOfMovie(movie, { watched: false })).not.toBeNull();
    expect(nextOfMovie(movie, { watched: true })).toBeNull();
  });

  it('counts a movie without a release date as released', () => {
    expect(nextOfMovie({} as TmdbMovieFull, undefined)).toMatchObject({
      airDate: new Date(0),
    });
  });
});

describe('nextOf', () => {
  it('reads the play state of the movie among those given', () => {
    expect(
      nextOf({ mediaType: MediaType.Movie, movie: {} as TmdbMovieFull }, [
        watched(0, 0),
      ]),
    ).toBeNull();
    expect(
      nextOf({ mediaType: MediaType.Series, series: SERIES }, [watched(0, 0)]),
    ).toMatchObject({ season: 1, episode: 1 });
  });
});
