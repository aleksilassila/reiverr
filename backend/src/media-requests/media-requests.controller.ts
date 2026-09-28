import { Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetAuthUser, UserAccessControl } from 'src/auth/auth.guard';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
  PaginationApiQuery,
} from 'src/common/common.decorator';
import {
  PaginatedResponseDto,
  PaginationDto,
  SuccessResponseDto,
} from 'src/common/common.dto';
import { User } from 'src/users/user.entity';
import { MediaRequestDto, MovieRequestDto } from './media-requests.dto';
import { MediaRequestsService } from './media-requests.service';

@ApiTags('media-requests')
@Controller('v2/users/:userId/media-requests')
@UseGuards(UserAccessControl)
export class MediaRequestsController {
  constructor(private readonly mediaRequestsService: MediaRequestsService) {}

  @Get()
  @PaginationApiQuery()
  @PaginatedApiOkResponse(MediaRequestDto)
  async getUserMediaRequests(
    @Param('userId') userId: string,
    @GetPaginationParams() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<MediaRequestDto>> {
    return this.mediaRequestsService.findByUser(userId, pagination);
  }

  @Get('movie/tmdb/:tmdbId')
  @ApiOkResponse({ type: MovieRequestDto })
  async getMovieRequest(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MovieRequestDto> {
    const request = await this.mediaRequestsService.findMovieRequest(
      userId,
      tmdbId,
    );

    return { tmdbId, request: request ?? undefined };
  }

  @Put('movie/tmdb/:tmdbId')
  @ApiOkResponse({ type: MediaRequestDto })
  async createMovieRequest(
    @GetAuthUser() user: User,
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MediaRequestDto> {
    return this.mediaRequestsService.createMovieRequest(
      userId,
      tmdbId,
      user.isAdmin,
    );
  }

  @Delete('movie/tmdb/:tmdbId')
  @ApiOkResponse({ type: SuccessResponseDto })
  async deleteMovieRequest(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SuccessResponseDto> {
    const result = await this.mediaRequestsService.deleteMovieRequest(
      userId,
      tmdbId,
    );

    return { success: result.affected > 0 };
  }
}
