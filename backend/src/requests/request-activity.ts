import type { PlayState } from '../user-data/play-state/play-state.entity.js';
import type { RequestRule } from './request-rule.entity.js';
import type { MediaRequest } from './request.entity.js';

/**
 * What a request does, going by its approval and the rule of its user for the
 * series: `active` wants its file and holds it, `kept` only holds a file it
 * has, the others want and hold nothing.
 */
export type Activity = 'waiting' | 'ahead' | 'watched' | 'kept' | 'active';

export interface ActivityState {
  requests: Pick<
    MediaRequest,
    'id' | 'userId' | 'tmdbId' | 'season' | 'episode' | 'approved'
  >[];
  rules: Pick<
    RequestRule,
    'userId' | 'tmdbId' | 'keepNext' | 'keepWatched' | 'keepWatchedHours'
  >[];
  /** Episode play states of the users and series that have a rule */
  playStates: Pick<
    PlayState,
    'userId' | 'tmdbId' | 'season' | 'episode' | 'watched' | 'watchedAt'
  >[];
  /** Milliseconds since the epoch */
  now: number;
}

const HOUR = 60 * 60 * 1000;

const keyOf = (...parts: (string | number)[]) => parts.join('/');

const byEpisode = (
  a: { season: number; episode: number },
  b: { season: number; episode: number },
) => a.season - b.season || a.episode - b.episode;

function groupBy<T>(items: T[], getKey: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(getKey(item));
    if (group) group.push(item);
    else groups.set(getKey(item), [item]);
  }

  return groups;
}

/**
 * The activity of every episode request, by its id. A request that waits for
 * approval is `waiting`. A rule looks at the approved requests of its user
 * for the series in episode order, whatever torrent each is bound to, so the
 * activity of one depends on all of them.
 *
 * Of the requests after the last watched episode, only the next keepNext are
 * active, the others are `ahead`. An episode in progress is not watched, so
 * its request is one of the next ones.
 *
 * With keepWatched or keepWatchedHours, a request for a watched episode
 * downloads nothing. It is `kept`, which is to hold on to a file that is in
 * the library, while it is among the last keepWatched watched requests or was
 * watched within keepWatchedHours, and `watched` otherwise. The last ones are
 * kept only while there is more to watch: a request after the last watched
 * episode. An episode that was marked watched before the time was stored
 * counts as watched long ago.
 *
 * The requests for unwatched episodes before the last watched one are active.
 */
export function evaluateActivity(state: ActivityState): Map<string, Activity> {
  const activity = new Map<string, Activity>(
    state.requests.map((request) => [
      request.id,
      request.approved ? 'active' : 'waiting',
    ]),
  );
  const requests = groupBy(
    state.requests.filter((request) => request.approved),
    (request) => keyOf(request.userId, request.tmdbId),
  );
  const playStates = groupBy(state.playStates, (playState) =>
    keyOf(playState.userId, playState.tmdbId),
  );

  for (const rule of state.rules) {
    const key = keyOf(rule.userId, rule.tmdbId);
    const ofSeries = (requests.get(key) ?? []).sort(byEpisode);
    const watchedEpisodes = (playStates.get(key) ?? [])
      .filter((playState) => playState.watched)
      .sort(byEpisode);
    const lastWatched = watchedEpisodes[watchedEpisodes.length - 1];
    const ahead = ofSeries.filter(
      (request) => !lastWatched || byEpisode(request, lastWatched) > 0,
    );

    if (rule.keepNext !== null) {
      for (const request of ahead.slice(rule.keepNext)) {
        activity.set(request.id, 'ahead');
      }
    }

    if (rule.keepWatched === null && rule.keepWatchedHours === null) continue;

    const watchedAt = new Map(
      watchedEpisodes.map((playState) => [
        keyOf(playState.season, playState.episode),
        playState.watchedAt?.getTime(),
      ]),
    );
    const watched = ofSeries.filter((request) =>
      watchedAt.has(keyOf(request.season, request.episode)),
    );

    watched.forEach((request, index) => {
      const at = watchedAt.get(keyOf(request.season, request.episode));
      const isAmongLast =
        rule.keepWatched !== null &&
        ahead.length > 0 &&
        index >= watched.length - rule.keepWatched;
      const isRecent =
        rule.keepWatchedHours !== null &&
        at !== undefined &&
        state.now - at < rule.keepWatchedHours * HOUR;

      activity.set(request.id, isAmongLast || isRecent ? 'kept' : 'watched');
    });
  }

  return activity;
}
