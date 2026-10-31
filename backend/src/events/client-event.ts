import { Title } from '../common/common.dto.js';

/**
 * What the server tells the clients of users when something they may show
 * changed without them, so that they fetch it again. An event with a user
 * goes to the clients of that user, the others to everyone; `data` is what
 * the client gets.
 */
export type ClientEvent =
  /** The requests, the rule or the preferences of the user for the title changed on the server */
  | { type: 'requests'; userId: string; data: Title }
  /** What the library has of the title, or what the requests of users have of it, changed */
  | { type: 'library'; userId?: never; data: Title }
  /** A torrent of the title changed: its items, its state, or its data */
  | { type: 'downloads'; userId?: never; data: Title }
  /** The quota of the user changed */
  | { type: 'storage'; userId: string; data: Record<string, never> };
