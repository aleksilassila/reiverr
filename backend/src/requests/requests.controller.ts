import {
  CreateRequestsResponse,
  DeleteRequestsResponse,
  MediaItem,
  RequestsResponse,
  UpdateRequestsResponse,
  WatchStatus,
} from '@aleksilassila/reiverr-shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  ParseBoolPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { GetAuthUser } from 'src/auth/auth.guard';
import { PaginatedApiOkResponse } from 'src/common/common.decorator';
import { PaginatedResponseDto } from 'src/common/common.dto';
import { MetadataService } from 'src/metadata/metadata.service';
import { PluginsService } from 'src/plugins/plugins.service';
import { User } from 'src/users/user.entity';
import {
  BulkUpdateRequestsBodyDto,
  CreateRequestsBodyDto,
  CreateRequestsDto,
  DeleteRequestDto,
  QueueItemDto,
  RequestsDto,
  UpdateQueueBodyDto,
  UpdateRequestDto,
} from './dtos/requests.dto';
import { PlayStatesService } from 'src/user-data/play-state/play-states.service';

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
  @PaginatedApiOkResponse(RequestsDto)
  async getRequests(
    @GetAuthUser() user: User,
    @Query('tmdbId') tmdbId: string,
    @Query('type') type: 'movie' | 'series',
  ): Promise<PaginatedResponseDto<RequestsDto>> {
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
      ).catch(() => ({ profiles: [], items: [] }) as RequestsResponse);

      return {
        pluginId: s.config.id,
        label: s.config.id,
        profiles: response.profiles.map((p) => ({
          ...p,
          pluginId: s.config.id,
          pluginLabel: s.config.id,
        })),
        items: response.items.map((i) => ({
          ...i,
          pluginId: s.config.id,
        })),
      };
    });

    const items = await Promise.all(responses);

    return {
      items,
      itemsPerPage: items.length,
      page: 1,
      total: items.length,
    };
  }

  @Post()
  @ApiQuery({ name: 'pluginId', type: String })
  @ApiBody({ type: CreateRequestsBodyDto })
  @ApiOkResponse({ type: CreateRequestsDto })
  async createRequests(
    @GetAuthUser() user: User,
    @Query('pluginId') pluginId: string,
    @Body() body: CreateRequestsBodyDto,
  ): Promise<CreateRequestsDto> {
    const service = this.pluginsService
      .getRequestsServices()
      .find((s) => s.config.id === pluginId)?.requestsService;

    if (!service) {
      throw new NotFoundException('Plugin not found');
    }

    const response = await firstValueFrom(
      service.CreateRequests({
        mediaItems: body.mediaItems,
        profileId: body.profileId,
        disabled: body.disabled,
      }),
    ).catch(() => ({ success: false, items: [] }) as CreateRequestsResponse);

    const items = response.items.map((item) => ({
      ...item,
      pluginId,
    }));

    return { success: response.success, items };
  }

  @Put()
  @ApiBody({ type: BulkUpdateRequestsBodyDto })
  @ApiOkResponse({ type: UpdateRequestDto })
  async bulkUpdateRequest(
    @GetAuthUser() user: User,
    @Body() body: BulkUpdateRequestsBodyDto,
  ): Promise<UpdateRequestDto> {
    const requestsServices = this.pluginsService.getRequestsServices();

    const responses = requestsServices.map(async (s) => {
      const response = await firstValueFrom(
        s.requestsService!.BulkUpdateRequests({
          requestIds: body.requestIds,
          disabled: body.disabled,
        }),
      ).catch(() => ({ success: false, items: [] }) as UpdateRequestsResponse);

      return { ...response, pluginId: s.config.id };
    });

    const successfulResponse = await Promise.all(responses).then((results) =>
      results
        .sort((a, b) => b.items.length - a.items.length)
        .find((r) => r.success),
    );

    if (!successfulResponse) {
      return { success: false, items: [] };
    }

    return {
      success: successfulResponse.success,
      items: successfulResponse.items.map((item) => ({
        ...item,
        pluginId: successfulResponse.pluginId,
      })),
    };
  }

  @Put('sync')
  @ApiQuery({ name: 'tmdbId', type: String })
  @ApiQuery({ name: 'type', enum: ['movie', 'series'] })
  @ApiOkResponse({ type: UpdateRequestDto })
  async syncWatchStatuses(
    @GetAuthUser() user: User,
    @Query('tmdbId') tmdbId: string,
    @Query('type') type: 'movie' | 'series',
  ): Promise<UpdateRequestDto> {
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
      async (s): Promise<UpdateRequestDto> => {
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

  @Delete()
  @ApiQuery({ name: 'pluginId', type: String })
  @ApiQuery({ name: 'requestId', type: String })
  @ApiOkResponse({ type: DeleteRequestDto })
  async deleteRequest(
    @GetAuthUser() user: User,
    @Query('pluginId') pluginId: string,
    @Query('requestId') requestId: string,
  ): Promise<DeleteRequestDto> {
    const service = this.pluginsService
      .getRequestsServices()
      .find((s) => s.config.id === pluginId)?.requestsService;

    if (!service) {
      throw new NotFoundException('Plugin not found');
    }

    const response = await firstValueFrom(
      service.DeleteRequests({ requestId }),
    ).catch(() => ({ success: false }) as DeleteRequestsResponse);

    return { success: response.success };
  }

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
  @ApiOkResponse({ type: UpdateRequestDto })
  async updateQueue(
    @GetAuthUser() user: User,
    @Query('pluginId') pluginId: string,
    @Body() body: UpdateQueueBodyDto,
  ): Promise<UpdateRequestDto> {
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

  private async getMediaItem(tmdbId: string, type: 'movie' | 'series') {
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
