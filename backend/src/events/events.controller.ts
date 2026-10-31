import { Controller, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { GetAuthUser, UserAccessControl } from '../auth/auth.guard.js';
import { User } from '../users/user.entity.js';
import { EventsService } from './events.service.js';

@ApiTags('events')
@Controller('me/events')
@UseGuards(UserAccessControl)
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Sse()
  @ApiProduces('text/event-stream')
  @ApiOkResponse({
    description:
      'Server-sent events that tell the client what to fetch again: `requests`, `library` and `downloads` with the title `{ mediaType, tmdbId }` as their data, and `storage`. EventSource sends no headers, so the token goes in the `reiverr_token` query parameter.',
  })
  getEvents(@GetAuthUser() user: User): Observable<MessageEvent> {
    return this.events.streamFor(user.id);
  }
}
