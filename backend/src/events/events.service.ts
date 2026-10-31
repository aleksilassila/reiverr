import { Injectable, MessageEvent } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { ServerResponse } from 'node:http';
import { filter, interval, map, merge, Observable, Subject } from 'rxjs';
import { ClientEvent } from './client-event.js';

// Keeps a proxy from closing a stream that is quiet
const KEEPALIVE_INTERVAL = 30_000;

/** The events of a unit of work, held until it is done */
interface Unit {
  events: ClientEvent[];
  done: boolean;
}

/**
 * Tells the connected clients what changed on the server, over the stream
 * of `GET /api/me/events`, so that they fetch it again. An event is emitted
 * where the change is written and goes out when the unit of work that
 * wrote it is done: the request, the job or the run, after its
 * transactions have committed, so that a client that fetches again on it
 * reads what was written. Outside a unit an event goes out at once, so a
 * run that writes is wrapped in `run`. This is a notification of the
 * clients of this process, not how the modules talk to each other, which
 * the jobs table is.
 */
@Injectable()
export class EventsService {
  private readonly units = new AsyncLocalStorage<Unit>();
  private readonly events = new Subject<ClientEvent>();

  /** Runs a job or a nightly run as a unit of work: its events go out when it is done */
  async run<T>(work: () => Promise<T>): Promise<T> {
    const unit: Unit = { events: [], done: false };
    try {
      return await this.units.run(unit, work);
    } finally {
      this.finish(unit);
    }
  }

  /** Runs the handling of a request as a unit of work: its events go out when the response is done */
  runRequest(res: ServerResponse, next: () => void): void {
    const unit: Unit = { events: [], done: false };
    res.once('close', () => this.finish(unit));
    this.units.run(unit, next);
  }

  emit(event: ClientEvent): void {
    const unit = this.units.getStore();
    if (unit && !unit.done) unit.events.push(event);
    else this.events.next(event);
  }

  /** The stream of a client of a user: the events for the user and for everyone */
  streamFor(userId: string): Observable<MessageEvent> {
    return merge(
      this.events.pipe(
        filter(
          (event) => event.userId === undefined || event.userId === userId,
        ),
        map(({ type, data }) => ({ type, data })),
      ),
      interval(KEEPALIVE_INTERVAL).pipe(map(() => ({ comment: 'keepalive' }))),
    );
  }

  private finish(unit: Unit): void {
    unit.done = true;
    for (const event of unit.events.splice(0)) this.events.next(event);
  }
}
