import { Controller } from '@nestjs/common';
import { MetadataService } from './metadata.service';

// @UseGuards(OptionalAccessControl)
@Controller()
export class MetadataController {
  constructor(private mediaService: MetadataService) {}

  // @ApiTags('movies')
  // @Get('movies/tmdb/:tmdbId')
  // @ApiOkResponse({ type: MovieDto })
  // async getMovieByTmdbId(
  //   @GetAuthUser() user: User,
  //   @Param('tmdbId') tmdbId: string,
  // ): Promise<MovieDto> {
  //   // let userData: MovieDto['userData'];

  //   // if (user) {
  //   //   const libraryItem = await this.libraryService.findByTmdbId(
  //   //     user.id,
  //   //     tmdbId,
  //   //   );

  //   //   userData = {
  //   //     inLibrary: !!libraryItem,
  //   //   };
  //   // }

  //   return this.mediaService.getMovieByTmdbId(tmdbId);
  // }

  // @ApiTags('movies')
  // @Get('movies/library')
  // @PaginatedApiOkResponse(MovieDto)
  // @UseGuards(UserAccessControl)
  // async getLibraryMovies(
  //   @GetAuthUser() user: User,
  //   @GetPaginationParams() pagination: PaginationParamsDto,
  // ): Promise<MovieDto[]> {
  //   const libraryItems = await this.libraryService.getLibraryItems(user.id);

  //   const items = await Promise.all(
  //     libraryItems.map((item) => this.mediaService.getm),
  //   );

  //   return {};
  // }
}
