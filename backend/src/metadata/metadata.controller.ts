import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserAccessControl } from 'src/auth/auth.guard';
import { MetadataService } from './metadata.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MovieMetadata, SeriesMetadata } from './metadata.entity';

@ApiTags('metadata')
@Controller('metadata')
export class MetadataController {
  constructor(private metadataService: MetadataService) {}

  @UseGuards(UserAccessControl)
  @Get('movie/:tmdbId')
  @ApiOkResponse({ type: MovieMetadata })
  async getMovie(@Param('tmdbId') tmdbId: string): Promise<MovieMetadata> {
    const movie = await this.metadataService.getMovieByTmdbId(tmdbId, true);

    if (!movie) {
      throw new NotFoundException(`Movie with tmdbId ${tmdbId} not found`);
    }

    return movie;
  }

  @UseGuards(UserAccessControl)
  @Get('series/:tmdbId')
  @ApiOkResponse({ type: SeriesMetadata })
  async getSeries(@Param('tmdbId') tmdbId: string): Promise<SeriesMetadata> {
    const series = await this.metadataService.getSeriesByTmdbId(tmdbId, true);

    if (!series) {
      throw new NotFoundException(`Series with tmdbId ${tmdbId} not found`);
    }

    return series;
  }

  @UseGuards(UserAccessControl)
  @Post('clear-cache')
  async clearCache() {
    await this.metadataService.clearMetadataCache();
  }
}
