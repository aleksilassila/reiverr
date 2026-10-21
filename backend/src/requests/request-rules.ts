import type { PlayState } from '../user-data/play-state/play-state.entity.js';
import type { RequestRule } from './request-rule.entity.js';
import type { MediaRequest } from './request.entity.js';
import { sourceOf } from './request-source.js';

/** What the rule changes about the requests */
export interface RuleOutcome {
  /** The requests whose watch stamp is not that of their play state, with the stamp to store */
  watched: Map<string, Date | null>;
  /** The requests that no keep setting retains */
  deleted: string[];
  /** The requests that pass the download-ahead gate for the first time */
  needed: string[];
}

const HOUR = 60 * 60 * 1000;

const byEpisode = (
  a: { season: number; episode: number },
  b: { season: number; episode: number },
) => a.season - b.season || a.episode - b.episode;

/**
 * Applies the rule of a user for a title to their requests for it. A request
 * row is a wish for its file, so the rule can only let a request through to
 * the library, or delete it.
 *
 * A request's `watchedAt` mirrors the play state of its episode. An episode
 * that was marked watched before the time was stored counts as watched long
 * ago.
 *
 * The rule looks at the approved requests in episode order. With keepWatched
 * or keepWatchedHours, the request for a watched episode is deleted unless
 * it is among the last keepWatched watched requests while there is more to
 * watch (a request after the last watched episode), or it was watched within
 * keepWatchedHours.
 *
 * Of the requests after the last watched episode, only the next keepNext are
 * needed, and a needed request stays so. An episode in progress is not
 * watched, so its request is one of the next ones. The requests for the
 * episodes up to the last watched one, skipped or watched, are needed.
 * Without a rule, or without keepNext, every approved request is. A request
 * only becomes needed with a source, the preference of its user for the
 * episode: without one it has not passed the gate, and a rule set later
 * applies to it. It takes its place in the window all the same, so that
 * nothing downloads past it.
 */
export function evaluateRules(pair: {
  /** The rule of the user for the title, when they have one */
  rule?: RequestRule;
  /** The requests of the user for the title */
  requests: MediaRequest[];
  /** The play states of the user for the title */
  playStates: PlayState[];
  /** Milliseconds since the epoch */
  now: number;
}): RuleOutcome {
  const { rule, requests, playStates, now } = pair;

  const stamps = new Map<string, Date | null>();
  const watchedAt = new Map<string, Date | null>();
  for (const request of requests) {
    const playState = playStates.find(
      (p) => p.season === request.season && p.episode === request.episode,
    );
    const at = playState?.watched ? (playState.watchedAt ?? new Date(0)) : null;
    watchedAt.set(request.id, at);
    if (at?.getTime() !== request.watchedAt?.getTime()) {
      stamps.set(request.id, at);
    }
  }

  const ordered = requests
    .filter((request) => request.approved)
    .sort(byEpisode);
  const lastWatched = playStates
    .filter((p) => p.watched)
    .sort(byEpisode)
    .pop();
  const ahead = ordered.filter(
    (request) => !lastWatched || byEpisode(request, lastWatched) > 0,
  );

  const deleted = new Set<string>();
  if (rule && (rule.keepWatched !== null || rule.keepWatchedHours !== null)) {
    const watched = ordered.filter((request) => watchedAt.get(request.id));
    watched.forEach((request, index) => {
      const at = (watchedAt.get(request.id) as Date).getTime();
      const isAmongLast =
        rule.keepWatched !== null &&
        ahead.length > 0 &&
        index >= watched.length - rule.keepWatched;
      const isRecent =
        rule.keepWatchedHours !== null &&
        now - at < rule.keepWatchedHours * HOUR;
      if (!isAmongLast && !isRecent) deleted.add(request.id);
    });
  }

  const next =
    rule && rule.keepNext !== null ? ahead.slice(0, rule.keepNext) : ahead;
  const needed: string[] = [];
  for (const request of ordered) {
    if (request.neededSince || deleted.has(request.id)) continue;

    const isInWindow = !ahead.includes(request) || next.includes(request);
    const hasSource = !!sourceOf(rule, request.season, request.episode);
    if (isInWindow && hasSource) needed.push(request.id);
  }

  return { watched: stamps, deleted: [...deleted], needed };
}
