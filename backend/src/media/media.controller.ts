import { StreamableItem } from '@aleksilassila/reiverr-shared';
import {
  Controller,
  Get,
  NotFoundException,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { GetAuthToken, GetAuthUser } from 'src/auth/auth.guard';
import { PaginatedApiOkResponse } from 'src/common/common.decorator';
import { PaginatedResponseDto } from 'src/common/common.dto';
import { PluginsService } from 'src/plugins/plugins.service';
import { MetadataService } from 'src/metadata/metadata.service';
import { User } from 'src/users/user.entity';
import { StreamablesDto, StreamDto } from './dtos/media.dto';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly clientsService: PluginsService,
    private readonly metadataService: MetadataService,
  ) {}

  @Get('streamables')
  @ApiQuery({ name: 'tmdbId', required: true, type: String })
  @ApiQuery({ name: 'season', required: false, type: Number })
  @ApiQuery({ name: 'episode', required: false, type: Number })
  @PaginatedApiOkResponse(StreamablesDto)
  async getStreamables(
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    @Query('tmdbId') tmdbId: string,
    @Query('season', new ParseIntPipe({ optional: true })) season?: number,
    @Query('episode', new ParseIntPipe({ optional: true })) episode?: number,
  ): Promise<PaginatedResponseDto<StreamablesDto>> {
    // Fetch metadata to get the correct title
    const isSeries = season !== undefined || episode !== undefined;
    const metadata = isSeries
      ? await this.metadataService.getSeriesByTmdbId(tmdbId)
      : await this.metadataService.getMovieByTmdbId(tmdbId);

    const title = metadata?.name || 'Unknown';

    const mediaServices = this.clientsService.getMediaServices();

    const groupResponses = mediaServices.map(
      async (s): Promise<StreamablesDto> => {
        const response = await firstValueFrom(
          s.mediaService!.GetStreamables({
            title,
            season,
            episode,
            tmdbId,
          }),
        ).catch((e) => ({ items: [] as StreamableItem[] }));

        return {
          pluginId: s.config.id,
          label: s.config.url, // TODO: change to user defined displayName
          streamables: response.items,
        };
      },
    );

    const groups = await Promise.all(groupResponses);

    return {
      items: groups,
      total: groups.length,
      itemsPerPage: groups.length,
      page: 1,
    };
  }

  @Get('stream')
  @ApiOkResponse({
    type: StreamDto,
  })
  async getStream(
    @Query('pluginId') pluginId: string,
    @Query('streamId') streamId: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
  ): Promise<StreamDto> {
    const mediaService = this.clientsService
      .getMediaServices()
      .find((s) => s.config.id === pluginId && s.mediaService)?.mediaService;

    if (!mediaService) {
      throw new NotFoundException('Media plugin not found');
    }

    const streamResponse = await firstValueFrom(
      mediaService.GetStream({ id: streamId }),
    ).catch((e) => {
      throw new NotFoundException('Stream not found');
    });

    return {
      videoTracks: streamResponse.videoTracks,
      subtitleTracks: streamResponse.subtitleTracks,
    };
  }
}
