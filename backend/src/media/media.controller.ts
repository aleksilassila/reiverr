import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  GetAuthUser,
  OptionalAccessControl,
  UserAccessControl,
} from 'src/auth/auth.guard';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
} from 'src/common/common.decorator';
import { PaginationParamsDto } from 'src/common/common.dto';
import { LibraryService } from 'src/users/library/library.service';
import { User } from 'src/users/user.entity';
import { MovieDto } from './media.dto';
import { MediaService } from './media.service';

// @UseGuards(OptionalAccessControl)
@Controller()
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @ApiTags('movies')
  @Get('movies/tmdb/:tmdbId')
  @ApiOkResponse({ type: MovieDto })
  async getMovieByTmdbId(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MovieDto> {
    // let userData: MovieDto['userData'];

    // if (user) {
    //   const libraryItem = await this.libraryService.findByTmdbId(
    //     user.id,
    //     tmdbId,
    //   );

    //   userData = {
    //     inLibrary: !!libraryItem,
    //   };
    // }

    return this.mediaService.getMovieByTmdbId(tmdbId);
  }

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
