import { MediaTypeFull } from '../common/common.dto.js';
import { PlayState } from '../user-data/play-state/play-state.entity.js';
import { RequestRule } from './request-rule.entity.js';
import { evaluateRules } from './request-rules.js';
import type { EpisodeSource, SeasonTorrent } from './request-source.js';
import { MediaRequest } from './request.entity.js';

const NOW = Date.UTC(2026, 0, 10);
const HOUR = 60 * 60 * 1000;

const request = (
  episode: number,
  options: { approved?: boolean; neededSince?: Date; watchedAt?: Date } = {},
): MediaRequest => ({
  ...new MediaRequest(),
  id: `e${episode}`,
  userId: 'a',
  mediaType: MediaTypeFull.Episode,
  tmdbId: '1',
  season: 1,
  episode,
  approved: options.approved ?? true,
  neededSince: options.neededSince,
  watchedAt: options.watchedAt,
});

const pack: SeasonTorrent = { season: 1, infoHash: 'pack' };
const own = (episode: number): EpisodeSource => ({
  season: 1,
  episode,
  kind: 'torrent',
  infoHash: 'own',
});

/** The rule of the user for the series, with the season's torrent as the source unless given */
const rule = (limits: Partial<RequestRule>): RequestRule => ({
  ...new RequestRule(),
  userId: 'a',
  tmdbId: '1',
  seasonTorrents: [pack],
  ...limits,
});

const watched = (episode: number, hoursAgo = 0): PlayState => ({
  ...new PlayState(),
  userId: 'a',
  mediaType: MediaTypeFull.Episode,
  tmdbId: '1',
  season: 1,
  episode,
  watched: true,
  watchedAt: new Date(NOW - hoursAgo * HOUR),
});

const started = (episode: number): PlayState => ({
  ...watched(episode),
  watched: false,
  watchedAt: undefined,
});

const evaluate = (pair: {
  rule?: RequestRule;
  requests?: MediaRequest[];
  playStates?: PlayState[];
}) => {
  const outcome = evaluateRules({
    requests: [],
    playStates: [],
    now: NOW,
    ...pair,
  });

  return {
    watched: Object.fromEntries(
      [...outcome.watched].map(([id, at]) => [id, at?.getTime() ?? null]),
    ),
    deleted: outcome.deleted,
    needed: outcome.needed,
  };
};

describe('evaluateRules', () => {
  it('lets through an approved request, not one that waits for approval', () => {
    expect(
      evaluate({
        rule: rule({}),
        requests: [request(1), request(2, { approved: false })],
      }),
    ).toEqual({ watched: {}, deleted: [], needed: ['e1'] });
  });

  it('lets through the next requests after the last watched episode, and leaves the rest for later', () => {
    const requests = [request(1), request(2), request(3)];
    const needed = (playStates: PlayState[]) =>
      evaluate({ rule: rule({ keepNext: 1 }), requests, playStates }).needed;

    expect(needed([])).toEqual(['e1']);
    // An episode in progress is not watched yet: its request is the next one
    expect(needed([started(1)])).toEqual(['e1']);
    expect(needed([watched(1)])).toEqual(['e1', 'e2']);
    expect(needed([watched(1), started(2)])).toEqual(['e1', 'e2']);
    // A skipped episode stays wanted
    expect(needed([watched(2)])).toEqual(['e1', 'e2', 'e3']);
  });

  it('counts the approved requests only', () => {
    const keepNext = rule({ keepNext: 1 });

    // Approving the first episode takes the place of the second
    expect(
      evaluate({
        rule: keepNext,
        requests: [request(1, { approved: false }), request(2)],
      }).needed,
    ).toEqual(['e2']);
    expect(
      evaluate({ rule: keepNext, requests: [request(1), request(2)] }).needed,
    ).toEqual(['e1']);
  });

  it('never takes the stamp back', () => {
    const keepNext = rule({ keepNext: 1 });
    const requests = [
      request(1),
      request(2, { neededSince: new Date(NOW - HOUR) }),
    ];

    expect(evaluate({ rule: keepNext, requests }).needed).toEqual(['e1']);
    expect(
      evaluate({
        rule: keepNext,
        requests: [{ ...requests[0], neededSince: new Date(NOW) }, requests[1]],
      }).needed,
    ).toEqual([]);
  });

  it('lets a request through only with a source, so that a rule set later applies to it', () => {
    const requests = [request(1), request(2), request(3)];

    expect(evaluate({ requests }).needed).toEqual([]);
    expect(
      evaluate({ rule: rule({ seasonTorrents: null }), requests }).needed,
    ).toEqual([]);
    // The source of an episode is its own, or else its season's
    expect(
      evaluate({
        rule: rule({ seasonTorrents: null, episodeSources: [own(2)] }),
        requests,
      }).needed,
    ).toEqual(['e2']);
    // A request without a source takes its place in the window
    expect(
      evaluate({
        rule: rule({
          keepNext: 2,
          seasonTorrents: null,
          episodeSources: [own(2), own(3)],
        }),
        requests,
      }).needed,
    ).toEqual(['e2']);
  });

  it('stamps a request with the time its episode was watched, as the play state has it', () => {
    const at = new Date(NOW - 2 * HOUR);
    const { watched: stamps } = evaluate({
      requests: [
        request(1),
        request(2, { watchedAt: at }),
        request(3, { watchedAt: at }),
        request(4, { approved: false }),
      ],
      playStates: [
        watched(1, 2),
        watched(3, 2),
        // Marked watched before the time was stored: long ago
        { ...watched(4), watchedAt: undefined },
      ],
    });

    expect(stamps).toEqual({ e1: at.getTime(), e2: null, e4: 0 });
  });

  it('deletes the watched requests that are not among the last ones', () => {
    const requests = [request(1), request(2), request(3), request(4)];
    const outcome = (playStates: PlayState[]) =>
      evaluate({ rule: rule({ keepWatched: 1 }), requests, playStates });

    expect(outcome([watched(1), watched(2), watched(3)])).toMatchObject({
      deleted: ['e1', 'e2'],
      needed: ['e3', 'e4'],
    });
    // Nothing is kept once nothing is left to watch
    expect(
      outcome([watched(1), watched(2), watched(3), watched(4)]).deleted,
    ).toEqual(['e1', 'e2', 'e3', 'e4']);
    // A skipped episode is not something left to watch
    expect(outcome([watched(2), watched(3), watched(4)])).toMatchObject({
      deleted: ['e2', 'e3', 'e4'],
      needed: ['e1'],
    });
  });

  it('deletes the watched requests that were not watched lately', () => {
    const requests = [request(1), request(2), request(3), request(4)];
    const playStates = [watched(1, 30), watched(3, 20)];
    const deleted = (keepWatchedHours: number) =>
      evaluate({ rule: rule({ keepWatchedHours }), requests, playStates })
        .deleted;

    expect(deleted(24)).toEqual(['e1']);
    expect(deleted(20)).toEqual(['e1', 'e3']);
    // An episode watched before the time was stored was watched long ago
    expect(
      evaluate({
        rule: rule({ keepWatchedHours: 24 }),
        requests,
        playStates: [{ ...watched(1), watchedAt: undefined }],
      }).deleted,
    ).toEqual(['e1']);
  });

  it('deletes with both limits only what neither of them keeps', () => {
    const requests = [request(1), request(2), request(3), request(4)];
    const both = rule({ keepWatched: 1, keepWatchedHours: 24 });

    expect(
      evaluate({
        rule: both,
        requests,
        playStates: [watched(1, 30), watched(2, 20), watched(3, 25)],
      }).deleted,
    ).toEqual(['e1']);
    // The time limit goes on keeping what was watched lately after the end
    expect(
      evaluate({
        rule: both,
        requests: requests.slice(0, 3),
        playStates: [watched(1, 30), watched(2, 30), watched(3)],
      }).deleted,
    ).toEqual(['e1', 'e2']);
  });

  it('deletes nothing without a keep setting', () => {
    expect(
      evaluate({
        rule: rule({ keepNext: 1 }),
        requests: [request(1), request(2)],
        playStates: [watched(1, 100), watched(2, 100)],
      }),
    ).toMatchObject({ deleted: [], needed: ['e1', 'e2'] });
  });
});
