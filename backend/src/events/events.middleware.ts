import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { EventsService } from './events.service.js';

/** Every request is a unit of work: what it changed is told once it is answered */
@Injectable()
export class EventsMiddleware implements NestMiddleware {
  constructor(private readonly events: EventsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.events.runRequest(res, next);
  }
}
