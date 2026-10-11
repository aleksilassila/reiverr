import { MediaType, MediaTypeFull } from '../common/common.dto.js';
import { evaluateRules, RuleState } from './request-rules.js';

const NOW = Date.UTC(2026, 0, 10);
const HOUR = 60 * 60 * 1000;

const request = (
  episode: number,
  options: {
    approved?: boolean;
    tmdbId?: string;
    userId?: string;
    activatedAt?: Date;
    watchedAt?: Date;
  } = {},
) => ({
  id: `${options.userId ?? 'a'}/${options.tmdbId ?? '1'}/${episode}`,
  userId: options.userId ?? 'a',
  mediaType: MediaTypeFull.Episode,
  tmdbId: options.tmdbId ?? '1',
  season: 1,
  episode,
  approved: options.approved ?? true,
  activatedAt: options.activatedAt,
  watchedAt: options.watchedAt,
});

const rule = (limits: Partial<RuleState['rules'][number]>) => ({
  userId: 'a',
  mediaType: MediaType.Series,
  tmdbId: '1',
  keepNext: null,
  keepWatched: null,
  keepWatchedHours: null,
  ...limits,
});

const watched = (episode: number, hoursAgo = 0) => ({
  userId: 'a',
  mediaType: MediaTypeFull.Episode,
  tmdbId: '1',
  season: 1,
  episode,
  watched: true,
  watchedAt: new Date(NOW - hoursAgo * HOUR),
});

const started = (episode: number) => ({
  ...watched(episode),
  watched: false,
  watchedAt: undefined,
});

const evaluate = (state: Partial<RuleState>) => {
  const outcome = evaluateRules({
    requests: [],
    rules: [],
    playStates: [],
    now: NOW,
    ...state,
  });

  return {
    watched: Object.fromEntries(
      [...outcome.watched].map(([id, at]) => [id, at?.getTime() ?? null]),
    ),
    deleted: outcome.deleted,
    activated: outcome.activated,
  };
};

describe('evaluateRules', () => {
  it('activates an approved request, not one that waits for approval', () => {
    expect(
      evaluate({ requests: [request(1), request(2, { approved: false })] }),
    ).toEqual({ watched: {}, deleted: [], activated: ['a/1/1'] });
  });

  it('activates the next requests after the last watched episode, and leaves the rest for later', () => {
    const rules = [rule({ keepNext: 1 })];
    const requests = [request(1), request(2), request(3)];
    const activated = (playStates: RuleState['playStates']) =>
      evaluate({ requests, rules, playStates }).activated;

    expect(activated([])).toEqual(['a/1/1']);
    // An episode in progress is not watched yet: its request is the next one
    expect(activated([started(1)])).toEqual(['a/1/1']);
    expect(activated([watched(1)])).toEqual(['a/1/1', 'a/1/2']);
    expect(activated([watched(1), started(2)])).toEqual(['a/1/1', 'a/1/2']);
    // A skipped episode stays wanted
    expect(activated([watched(2)])).toEqual(['a/1/1', 'a/1/2', 'a/1/3']);
  });

  it('counts the approved requests of the user for the series', () => {
    const rules = [rule({ keepNext: 1 })];

    // Approving the first episode takes the place of the second
    expect(
      evaluate({
        requests: [request(1, { approved: false }), request(2)],
        rules,
      }).activated,
    ).toEqual(['a/1/2']);
    expect(
      evaluate({ requests: [request(1), request(2)], rules }).activated,
    ).toEqual(['a/1/1']);
    // Another series, and another user, have a window of their own
    expect(
      evaluate({
        requests: [
          request(1),
          request(2),
          request(2, { tmdbId: '2' }),
          request(2, { userId: 'b' }),
        ],
        rules,
      }).activated,
    ).toEqual(['a/1/1', 'a/2/2', 'b/1/2']);
  });

  it('never takes an activation back', () => {
    const rules = [rule({ keepNext: 1 })];
    const requests = [
      request(1),
      request(2, { activatedAt: new Date(NOW - HOUR) }),
    ];

    expect(evaluate({ requests, rules }).activated).toEqual(['a/1/1']);
    expect(
      evaluate({
        requests: [{ ...requests[0], activatedAt: new Date(NOW) }, requests[1]],
        rules,
      }).activated,
    ).toEqual([]);
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

    expect(stamps).toEqual({
      'a/1/1': at.getTime(),
      'a/1/2': null,
      'a/1/4': 0,
    });
  });

  it('deletes the watched requests that are not among the last ones', () => {
    const requests = [request(1), request(2), request(3), request(4)];
    const rules = [rule({ keepWatched: 1 })];
    const outcome = (playStates: RuleState['playStates']) =>
      evaluate({ requests, rules, playStates });

    expect(outcome([watched(1), watched(2), watched(3)])).toMatchObject({
      deleted: ['a/1/1', 'a/1/2'],
      activated: ['a/1/3', 'a/1/4'],
    });
    // Nothing is kept once nothing is left to watch
    expect(
      outcome([watched(1), watched(2), watched(3), watched(4)]).deleted,
    ).toEqual(['a/1/1', 'a/1/2', 'a/1/3', 'a/1/4']);
    // A skipped episode is not something left to watch
    expect(outcome([watched(2), watched(3), watched(4)])).toMatchObject({
      deleted: ['a/1/2', 'a/1/3', 'a/1/4'],
      activated: ['a/1/1'],
    });
  });

  it('deletes the watched requests that were not watched lately', () => {
    const requests = [request(1), request(2), request(3), request(4)];
    const playStates = [watched(1, 30), watched(3, 20)];
    const deleted = (keepWatchedHours: number) =>
      evaluate({ requests, rules: [rule({ keepWatchedHours })], playStates })
        .deleted;

    expect(deleted(24)).toEqual(['a/1/1']);
    expect(deleted(20)).toEqual(['a/1/1', 'a/1/3']);
    // An episode watched before the time was stored was watched long ago
    expect(
      evaluate({
        requests,
        rules: [rule({ keepWatchedHours: 24 })],
        playStates: [{ ...watched(1), watchedAt: undefined }],
      }).deleted,
    ).toEqual(['a/1/1']);
  });

  it('deletes with both limits only what neither of them keeps', () => {
    const requests = [request(1), request(2), request(3), request(4)];
    const rules = [rule({ keepWatched: 1, keepWatchedHours: 24 })];

    expect(
      evaluate({
        requests,
        rules,
        playStates: [watched(1, 30), watched(2, 20), watched(3, 25)],
      }).deleted,
    ).toEqual(['a/1/1']);
    // The time limit goes on keeping what was watched lately after the end
    expect(
      evaluate({
        requests: requests.slice(0, 3),
        rules,
        playStates: [watched(1, 30), watched(2, 30), watched(3)],
      }).deleted,
    ).toEqual(['a/1/1', 'a/1/2']);
  });

  it('deletes nothing without a keep setting', () => {
    expect(
      evaluate({
        requests: [request(1), request(2)],
        rules: [rule({ keepNext: 1 })],
        playStates: [watched(1, 100), watched(2, 100)],
      }),
    ).toMatchObject({ deleted: [], activated: ['a/1/1', 'a/1/2'] });
  });
});
