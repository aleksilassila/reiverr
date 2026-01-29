import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { GetAuthToken, GetAuthUser } from 'src/auth/auth.guard';
import { User } from 'src/users/user.entity';
import { VideoCandidateDto, VideoStreamDto } from './dtos/media.dto';
import { MediaPluginsService } from './media-plugins.service';
import { PaginatedResponseDto } from 'src/common/common.dto';
import { PaginatedApiOkResponse } from 'src/common/common.decorator';

class CandidatesGroupDto {
  @ApiProperty()
  groupLabel: string;

  @ApiProperty()
  groupId: string;

  @ApiProperty({ type: [VideoCandidateDto] })
  candidates: VideoCandidateDto[];
}

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaPluginsService: MediaPluginsService) {}

  @Get('candidates')
  @PaginatedApiOkResponse(CandidatesGroupDto)
  // @ApiOkResponse({
  //   type: CandidateGroupsDto,
  // })
  async getVideoCandidates(
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    @Query('tmdbId') tmdbId: string,
    @Query('season', new ParseIntPipe({ optional: true })) season?: number,
    @Query('episode', new ParseIntPipe({ optional: true })) episode?: number,
  ): Promise<PaginatedResponseDto<CandidatesGroupDto>> {
    const plugins = this.mediaPluginsService.getPlugins();
    console.log('Plugins:', Object.keys(plugins));

    const groupsP = plugins.map(async (p) => {
      const candidates = await p.getVideoCandidates({
        tmdbId: tmdbId,
        season,
        episode,
      });

      return {
        groupLabel: p.settings.name,
        groupId: p.settings.id,
        candidates: candidates.candidates,
      };
    });

    const groups = await Promise.all(groupsP);

    return {
      items: groups,
      total: groups.length,
      itemsPerPage: groups.length,
      page: 1,
    };
  }

  @Post('get-stream')
  @ApiOkResponse({
    type: VideoStreamDto,
  })
  // @ApiBody({ required: false, type: MediaSourceActionBodyDto })
  async getStream(
    @Query('mediaPluginId') mediaPluginId: string,
    @Query('candidateId') candidateId: string,
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
