import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiProperty } from '@nestjs/swagger';
import { GetAuthToken, GetAuthUser } from 'src/auth/auth.guard';
import { User } from 'src/users/user.entity';
import { VideoCandidateDto, VideoStreamDto } from './dtos/media.dto';
import { MediaPluginsService } from './media-plugins.service';
import { PaginatedResponseDto } from 'src/common/common.dto';
import { PaginatedApiOkResponse } from 'src/common/common.decorator';

class VideoCandidatesDto {
  @ApiProperty({ type: [VideoCandidateDto] })
  candidates: VideoCandidateDto[];
}

@Controller('media')
export class MediaController {
  constructor(private readonly mediaPluginsService: MediaPluginsService) {}

  @Get('candidates')
  @PaginatedApiOkResponse(VideoCandidateDto)
  async getVideoCandidates(
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    @Query('tmdbId') tmdbId: string,
    @Query('season', new ParseIntPipe({ optional: true })) season?: number,
    @Query('episode', new ParseIntPipe({ optional: true })) episode?: number,
  ): Promise<PaginatedResponseDto<VideoCandidateDto>> {
    const plugins = this.mediaPluginsService.getPlugins();

    const promises = plugins.map((p) =>
      p.getVideoCandidates({ tmdbId: tmdbId, season, episode }),
    );

    const candidates = await Promise.all(promises).then((r) =>
      r.flatMap((p) => p.candidates),
    );

    return {
      items: candidates,
      total: candidates.length,
      itemsPerPage: candidates.length,
      page: 1,
    };
  }

  @Post(':mediaPluginId/stream/:candidateId')
  @ApiOkResponse({
    type: VideoStreamDto,
  })
  // @ApiBody({ required: false, type: MediaSourceActionBodyDto })
  async getStream(
    @Param('mediaPluginId') mediaPluginId: string,
    @Param('candidateId') candidateId: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    // @Body() config: MediaSourceActionBodyDto = {},
  ): Promise<VideoStreamDto> {
    const plugin = this.mediaPluginsService.getPlugin(mediaPluginId);

    if (!plugin) throw new NotFoundException('Media plugin not found');

    const videoStream = await plugin
      .getVideoStream({ candidateId })
      .then((r) => r.stream);

    return videoStream;
  }
}
