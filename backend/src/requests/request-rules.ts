import { MediaType, MediaTypeFull } from '../common/common.dto.js';
import type { PlayState } from '../user-data/play-state/play-state.entity.js';
import type { RequestRule } from './request-rule.entity.js';
import type { MediaRequest } from './request.entity.js';
import { preferenceOf } from './torrent-preference.js';

/** The title a request is for, as the rules and files know it */
export const titleTypeOf = (mediaType: MediaTypeFull): MediaType =>
  mediaType === MediaTypeFull.Movie ? MediaType.Movie : MediaType.Series;

/** The play states of a title, as the requests for it are typed */
export const fullTypeOf = (mediaType: MediaType): MediaTypeFull =>
  mediaType === MediaType.Movie ? MediaTypeFull.Movie : MediaTypeFull.Episode;

export interface RuleState {
  requests: Pick<
    MediaRequest,
    | 'id'
    | 'userId'
    | 'mediaType'
    | 'tmdbId'
    | 'season'
    | 'episode'
    | 'approved'
    | 'activatedAt'
    | 'watchedAt'
  >[];
  rules: Pick<
    RequestRule,
    | 'userId'
    | 'mediaType'
    | 'tmdbId'
    | 'keepNext'
    | 'keepWatched'
    | 'keepWatchedHours'
    | 'seasonTorrents'
    | 'episodeSources'
  >[];
  /** The play states of the users and titles of the requests */
  playStates: Pick<
    PlayState,
    | 'userId'
    | 'mediaType'
    | 'tmdbId'
    | 'season'
    | 'episode'
    | 'watched'
    | 'watchedAt'
  >[];
  /** Milliseconds since the epoch */
  now: number;
}

/** What the rules change about the requests */
export interface RuleOutcome {
  /** The requests whose watch stamp is not that of their play state, with the stamp to store */
  watched: Map<string, Date | null>;
  /** The requests that no keep setting retains */
  deleted: string[];
  /** The requests that pass the download-ahead gate for the first time */
  activated: string[];
}

const HOUR = 60 * 60 * 1000;

const keyOf = (...parts: (string | number)[]) => parts.join('/');

/** item: { userId: string; mediaType: MediaTypeFull; tmdbId: string; } => "userId/series/1234" */
const pairOf = (item: {
  userId: string;
  mediaType: MediaTypeFull;
  tmdbId: string;
}) => keyOf(item.userId, titleTypeOf(item.mediaType), item.tmdbId);

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
 * When an episode was watched, by its play state. An episode that was marked
 * watched before the time was stored counts as watched long ago.
 */
const watchedAtOf = (
  playState: RuleState['playStates'][number] | undefined,
): Date | null =>
  playState?.watched ? (playState.watchedAt ?? new Date(0)) : null;

/**
 * Applies the rules to the requests. A request row is a wish for its file,
 * so a rule can only let a request through to downloading, or delete it.
 *
 * A request's `watchedAt` mirrors the play state of its episode.
 *
 * A rule looks at the approved requests of its user for the title in episode
 * order. With keepWatched or keepWatchedHours, the request for a watched
 * episode is deleted unless it is among the last keepWatched watched
 * requests, while there is more to watch (a request after the last watched
 * episode), or it was watched within keepWatchedHours.
 *
 * Of the requests after the last watched episode, only the next keepNext are
 * activated, and an activated request stays so. An episode in progress is not
 * watched, so its request is one of the next ones. The requests for episodes
 * up to the last watched one, skipped or watched, are activated. Without a
 * rule, or without keepNext, every approved request is. A request is only
 * activated with a source, the preference of its user for the episode:
 * without one it has not passed the gate, and a rule set later applies to
 * it. It takes its place in the window all the same, so that nothing
 * downloads past it.
 */
export function evaluateRules(state: RuleState): RuleOutcome {
  const outcome: RuleOutcome = {
    watched: new Map(),
    deleted: [],
    activated: [],
  };
  const playStates = groupBy(state.playStates, pairOf);
  const playStateOf = (request: RuleState['requests'][number]) =>
    playStates
      .get(pairOf(request))
      ?.find(
        (playState) =>
          playState.season === request.season &&
          playState.episode === request.episode,
      );

  const watchedAt = new Map<string, Date | null>();
  for (const request of state.requests) {
    const at = watchedAtOf(playStateOf(request));
    watchedAt.set(request.id, at);
    if (at?.getTime() !== request.watchedAt?.getTime()) {
      outcome.watched.set(request.id, at);
    }
  }

  const rules = new Map(
    state.rules.map((rule) => [
      keyOf(rule.userId, rule.mediaType, rule.tmdbId),
      rule,
    ]),
  );
  const approved = groupBy(
    state.requests.filter((request) => request.approved),
    pairOf,
  );

  for (const [pair, requests] of approved) {
    const rule = rules.get(pair);
    const lastWatched = (playStates.get(pair) ?? [])
      .filter((playState) => playState.watched)
      .sort(byEpisode)
      .pop();
    const ofTitle = requests.sort(byEpisode);
    const ahead = ofTitle.filter(
      (request) => !lastWatched || byEpisode(request, lastWatched) > 0,
    );

    const deleted = new Set<string>();
    if (rule && (rule.keepWatched !== null || rule.keepWatchedHours !== null)) {
      const watched = ofTitle.filter((request) => watchedAt.get(request.id));
      watched.forEach((request, index) => {
        const at = (watchedAt.get(request.id) as Date).getTime();
        const isAmongLast =
          rule.keepWatched !== null &&
          ahead.length > 0 &&
          index >= watched.length - rule.keepWatched;
        const isRecent =
          rule.keepWatchedHours !== null &&
          state.now - at < rule.keepWatchedHours * HOUR;
        if (!isAmongLast && !isRecent) deleted.add(request.id);
      });
      outcome.deleted.push(...deleted);
    }

    const next =
      rule && rule.keepNext !== null ? ahead.slice(0, rule.keepNext) : ahead;
    for (const request of ofTitle) {
      const passes = !ahead.includes(request) || next.includes(request);
      const hasSource = !!preferenceOf(rule, request.season, request.episode);
      if (
        passes &&
        hasSource &&
        !request.activatedAt &&
        !deleted.has(request.id)
      ) {
        outcome.activated.push(request.id);
      }
    }
  }

  return outcome;
}
