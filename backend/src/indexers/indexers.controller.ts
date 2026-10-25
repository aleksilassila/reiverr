import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminAccessControl, UserAccessControl } from '../auth/auth.guard.js';
import { IndexerSettingsDto, ReleaseDto } from './indexers.dto.js';
import { IndexersService, Release } from './indexers.service.js';

@ApiTags('indexers')
@Controller('indexers')
@UseGuards(UserAccessControl)
export class IndexersController {
  constructor(private readonly indexersService: IndexersService) {}

  @Get()
  @UseGuards(AdminAccessControl)
  @ApiOkResponse({ type: IndexerSettingsDto })
  async getIndexers(): Promise<IndexerSettingsDto> {
    return { indexers: await this.indexersService.getIndexers() };
  }

  @Put()
  @UseGuards(AdminAccessControl)
  @ApiOkResponse({ type: IndexerSettingsDto })
  async updateIndexers(
    @Body() settings: IndexerSettingsDto,
  ): Promise<IndexerSettingsDto> {
    return {
      indexers: await this.indexersService.updateIndexers(settings?.indexers),
    };
  }

  @Get('search/series/:tmdbId')
  @ApiQuery({ name: 'season', type: Number })
  @ApiQuery({
    name: 'episode',
    type: Number,
    required: false,
    description: 'Omit to search for season packs',
  })
  @ApiOkResponse({ type: [ReleaseDto] })
  async searchSeriesReleases(
    @Param('tmdbId') tmdbId: string,
    @Query('season', ParseIntPipe) season: number,
    @Query('episode', new ParseIntPipe({ optional: true })) episode?: number,
  ): Promise<ReleaseDto[]> {
    const releases = await this.indexersService.searchSeries(
      tmdbId,
      season,
      episode,
    );

    return releases.map(toReleaseDto);
  }

  @Get('search/movies/:tmdbId')
  @ApiOkResponse({ type: [ReleaseDto] })
  async searchMovieReleases(
    @Param('tmdbId') tmdbId: string,
  ): Promise<ReleaseDto[]> {
    const releases = await this.indexersService.searchMovies(tmdbId);

    return releases.map(toReleaseDto);
  }
}

function toReleaseDto(release: Release): ReleaseDto {
  return {
    id: release.id,
    title: release.title,
    indexer: release.indexer,
    size: release.size,
    seeders: release.seeders,
    peers: release.peers,
    publishedAt: release.publishedAt,
    infoHash: release.infoHash,
    seasons: release.seasons,
    episodes: release.episodes,
  };
}
