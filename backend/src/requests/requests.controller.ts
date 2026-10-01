import {
  MediaItem,
  RequestsResponse,
  UpdateRequestsResponse,
  WatchStatus,
} from '@aleksilassila/reiverr-shared';
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { GetAuthUser } from '../auth/auth.guard.js';
import { PaginatedApiOkResponse } from '../common/common.decorator.js';
import { PaginatedResponseDto } from '../common/common.dto.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { PluginsService } from '../plugins/plugins.service.js';
import { PlayStatesService } from '../user-data/play-state/play-states.service.js';
import { User } from '../users/user.entity.js';
import {
  QueueItemDto,
  RequestsDto,
  UpdateQueueBodyDto,
  UpdateRequestsBodyDto,
  UpdateRequestsDto,
} from './dtos/requests.dto.js';

@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(
    private readonly pluginsService: PluginsService,
    private readonly metadataService: MetadataService,
    private readonly playStatesService: PlayStatesService,
  ) {}

  @Get()
  @ApiQuery({ name: 'tmdbId', type: String })
  @ApiQuery({ name: 'type', enum: ['movie', 'series'] })
  @ApiOkResponse({ type: RequestsDto })
  async getRequests(
    @GetAuthUser() user: User,
    @Query('tmdbId') tmdbId: string,
    @Query('type') type: 'movie' | 'series',
  ): Promise<RequestsDto> {
    const requestsServices = this.pluginsService.getRequestsServices();

    const mediaItem = await this.getMediaItem(tmdbId, type);

    if (!mediaItem) {
      throw new NotFoundException('Media item not found');
    }

    const responses = requestsServices.map(async (s): Promise<RequestsDto> => {
      const response = await firstValueFrom(
        s.requestsService!.GetRequests({
          mediaItem,
        }),
      ).catch(() => ({ profiles: [], requests: [] }) as RequestsResponse);

      return {
        profiles: response.profiles.map((p) => ({
          ...p,
          pluginId: s.config.id,
          pluginLabel: s.config.id,
        })),
        requests: response.requests.map((i) => ({
          ...i,
          pluginId: s.config.id,
        })),
      };
    });

    const items = await Promise.all(responses);

    return {
      requests: items.map((r) => r.requests).flat(),
      profiles: items.map((r) => r.profiles).flat(),
    };
  }

  @Post()
  @ApiQuery({ name: 'tmdbId', type: String })
  @ApiQuery({ name: 'type', enum: ['movie', 'series'] })
  @ApiBody({ type: UpdateRequestsBodyDto })
  @ApiOkResponse({ type: UpdateRequestsDto })
  async updateRequests(
    @Query('tmdbId') tmdbId: string,
    @Query('type') type: 'movie' | 'series',
    @Body() body: UpdateRequestsBodyDto,
  ): Promise<UpdateRequestsDto> {
    const services = this.pluginsService.getRequestsServices();
    const mediaItem = await this.getMediaItem(tmdbId, type);

    if (!mediaItem) {
      throw new NotFoundException('Media item not found');
    }

    const mediaItems: MediaItem[] =
      type === 'movie'
        ? [mediaItem]
        : body.episodeIds.map((id) => ({
            ...mediaItem,
            season: Number(id.split('-')[0]),
            episode: Number(id.split('-')[1]),
          }));

    const addServices = services.filter((s) =>
      body.pluginProfilesToAdd.some((p) => p.startsWith(s.config.id)),
    );

    const createPromises = addServices.map(async (s) => {
      const profileIds = body.pluginProfilesToAdd
        .filter((p) => p.startsWith(s.config.id))
        .map((p) => p.split(':')[1]);

      const promises = profileIds.map((profileId) =>
        firstValueFrom(
          s.requestsService!.CreateRequests({
            mediaItems,
            profileId,
            disabled: true,
          }),
        )
          .then((r) => r.success)
          .catch(() => false),
      );

      return Promise.all(promises).then((r) => r.every((s) => s));
    });

    const deleteServices = services.filter((s) =>
      body.pluginRequestsToDelete.some((r) => r.startsWith(s.config.id)),
    );

    const deletePromises = deleteServices.map(async (s) => {
      const requestIds = body.pluginRequestsToDelete
        .filter((r) => r.startsWith(s.config.id))
        .map((r) => r.split(':')[1]);

      const promises = requestIds.map((requestId) =>
        firstValueFrom(s.requestsService!.DeleteRequests({ requestId })).then(
          (r) => r.success,
        ),
      );

      return Promise.all(promises).then((r) => r.every((s) => s));
    });

    const success = await Promise.all([
      ...createPromises,
      ...deletePromises,
    ]).then((r) => r.every((s) => s));

    return { success, items: [] };
  }

  // @Post()
  // @ApiQuery({ name: 'pluginId', type: String })
  // @ApiBody({ type: CreateRequestsBodyDto })
  // @ApiOkResponse({ type: CreateRequestsDto })
  // async createRequests(
  //   @GetAuthUser() user: User,
  //   @Query('pluginId') pluginId: string,
  //   @Body() body: CreateRequestsBodyDto,
  // ): Promise<CreateRequestsDto> {
  //   const service = this.pluginsService
  //     .getRequestsServices()
  //     .find((s) => s.config.id === pluginId)?.requestsService;

  //   if (!service) {
  //     throw new NotFoundException('Plugin not found');
  //   }

  //   const response = await firstValueFrom(
  //     service.CreateRequests({
  //       mediaItems: body.mediaItems,
  //       profileId: body.profileId,
  //       disabled: body.disabled,
  //     }),
  //   ).catch(() => ({ success: false, items: [] }) as CreateRequestsResponse);

  //   const items = response.items.map((item) => ({
  //     ...item,
  //     pluginId,
  //   }));

  //   return { success: response.success, items };
  // }

  // @Put()
  // @ApiBody({ type: BulkUpdateRequestsBodyDto })
  // @ApiOkResponse({ type: UpdateRequestsDto })
  // async bulkUpdateRequest(
  //   @GetAuthUser() user: User,
  //   @Body() body: BulkUpdateRequestsBodyDto,
  // ): Promise<UpdateRequestsDto> {
  //   const requestsServices = this.pluginsService.getRequestsServices();

  //   const responses = requestsServices.map(async (s) => {
  //     const response = await firstValueFrom(
  //       s.requestsService!.BulkUpdateRequests({
  //         requestIds: body.requestIds,
  //         disabled: body.disabled,
  //       }),
  //     ).catch(() => ({ success: false, items: [] }) as UpdateRequestsResponse);

  //     return { ...response, pluginId: s.config.id };
  //   });

  //   const successfulResponse = await Promise.all(responses).then((results) =>
  //     results
  //       .sort((a, b) => b.items.length - a.items.length)
  //       .find((r) => r.success),
  //   );

  //   if (!successfulResponse) {
  //     return { success: false, items: [] };
  //   }

  //   return {
  //     success: successfulResponse.success,
  //     items: successfulResponse.items.map((item) => ({
  //       ...item,
  //       pluginId: successfulResponse.pluginId,
  //     })),
  //   };
  // }

  @Put('sync')
  @ApiQuery({ name: 'tmdbId', type: String })
  @ApiQuery({ name: 'type', enum: ['movie', 'series'] })
  @ApiOkResponse({ type: UpdateRequestsDto })
  async syncWatchStatuses(
    @GetAuthUser() user: User,
    @Query('tmdbId') tmdbId: string,
    @Query('type') type: 'movie' | 'series',
  ): Promise<UpdateRequestsDto> {
    const requestsServices = this.pluginsService.getRequestsServices();
    const mediaItem = await this.getMediaItem(tmdbId, type);

    if (!mediaItem) {
      throw new NotFoundException('Media item not found');
    }

    let watchStatuses: WatchStatus[] = [];

    if (type === 'series') {
      const playStates = await this.playStatesService.findSeriesPlayStates(
        user.id,
        tmdbId,
      );

      watchStatuses = playStates.map((ps) => ({
        mediaItem,
        watched: ps.watched,
        lastWatchedAt: ps.lastPlayedAt?.toISOString(),
      }));
    } else {
      const playState = await this.playStatesService.findMoviePlayState(
        user.id,
        tmdbId,
      );
      if (playState) {
        watchStatuses.push({
          mediaItem,
          watched: playState.watched,
          lastWatchedAt: playState.lastPlayedAt?.toISOString(),
        });
      }
    }

    if (!watchStatuses?.length) {
      return { success: true, items: [] };
    }

    const responsesP = requestsServices.map(
      async (s): Promise<UpdateRequestsDto> => {
        const response = await firstValueFrom(
          s.requestsService!.SyncWatchStatus({
            watchStatuses,
          }),
        ).catch(
          () => ({ success: false, items: [] }) as UpdateRequestsResponse,
        );

        return {
          ...response,
          items: response.items.map((i) => ({
            ...i,
            pluginId: s.config.id,
          })),
        };
      },
    );

    return {
      success: true,
      items: await Promise.all(responsesP).then((results) =>
        results.map((r) => r.items).flat(),
      ),
    };
  }

  // @Delete()
  // @ApiQuery({ name: 'pluginId', type: String })
  // @ApiQuery({ name: 'requestId', type: String })
  // @ApiOkResponse({ type: DeleteRequestDto })
  // async deleteRequest(
  //   @GetAuthUser() user: User,
  //   @Query('pluginId') pluginId: string,
  //   @Query('requestId') requestId: string,
  // ): Promise<DeleteRequestDto> {
  //   const service = this.pluginsService
  //     .getRequestsServices()
  //     .find((s) => s.config.id === pluginId)?.requestsService;

  //   if (!service) {
  //     throw new NotFoundException('Plugin not found');
  //   }

  //   const response = await firstValueFrom(
  //     service.DeleteRequests({ requestId }),
  //   ).catch(() => ({ success: false }) as DeleteRequestsResponse);

  //   return { success: response.success };
  // }

  @Get('queue')
  @ApiQuery({ name: 'pluginId', type: String })
  @ApiQuery({ name: 'requestId', type: String })
  @PaginatedApiOkResponse(QueueItemDto)
  async getRequestQueue(
    @GetAuthUser() user: User,
    @Query('pluginId') pluginId: string,
    @Query('requestId') requestId: string,
  ): Promise<PaginatedResponseDto<QueueItemDto>> {
    const service = this.pluginsService
      .getRequestsServices()
      .find((s) => s.config.id === pluginId)?.requestsService;

    if (!service) {
      throw new NotFoundException('Plugin not found');
    }

    const response = await firstValueFrom(
      service.GetRequestQueue({ requestId }),
    ).catch(() => ({ queue: [] }));

    return {
      items: response.queue,
      itemsPerPage: response.queue.length,
      page: 1,
      total: response.queue.length,
    };
  }

  @Put('queue')
  @ApiQuery({ name: 'pluginId', type: String })
  @ApiBody({ type: UpdateQueueBodyDto })
  @ApiOkResponse({ type: UpdateRequestsDto })
  async updateQueue(
    @GetAuthUser() user: User,
    @Query('pluginId') pluginId: string,
    @Body() body: UpdateQueueBodyDto,
  ): Promise<UpdateRequestsDto> {
    const service = this.pluginsService
      .getRequestsServices()
      .find((s) => s.config.id === pluginId)?.requestsService;

    if (!service) {
      throw new NotFoundException('Plugin not found');
    }

    const response = await firstValueFrom(
      service.UpdateQueue({
        requestId: body.requestId,
        queueItemIds: body.queueItemIds,
      }),
    ).catch(() => ({ success: false, items: [] }) as UpdateRequestsResponse);

    const items = response.items.map((item) => ({
      ...item,
      pluginId,
    }));

    return { success: response.success, items };
  }

  private async getMediaItem(
    tmdbId: string,
    type: 'movie' | 'series',
  ): Promise<MediaItem | undefined> {
    const metadata =
      type === 'series'
        ? await this.metadataService.getSeriesByTmdbId(tmdbId)
        : await this.metadataService.getMovieByTmdbId(tmdbId);

    const title = metadata?.name || 'Unknown';
    const mediaItem: MediaItem | undefined = !!tmdbId
      ? {
          title,
          tmdbId,
          mediaType: type === 'movie' ? 'movie' : 'series',
        }
      : undefined;

    return mediaItem;
  }
}
