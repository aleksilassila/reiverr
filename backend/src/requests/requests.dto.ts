import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { EpisodeRefDto } from '../common/common.dto.js';
import { RequestRule } from './request-rule.entity.js';
import { MediaRequest } from './request.entity.js';

export class MediaRequestDto extends MediaRequest {
  @ApiProperty({
    description:
      'Whether the download-ahead window of the rule of the user holds the request back until they have watched up to it',
  })
  ahead: boolean;
}

export class RequestRuleDto extends PickType(RequestRule, [
  'keepNext',
  'keepWatched',
  'keepWatchedHours',
]) {}

/** The one limit of the rule of a movie: download ahead and keep last watched have no meaning for a single request */
export class MovieRequestRuleDto extends PickType(RequestRule, [
  'keepWatchedHours',
]) {}

/** A release as a user picked it, which downloads gets when a request needs it */
export class SelectedReleaseDto {
  @ApiProperty()
  infoHash: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  indexer: string;

  @ApiProperty({ description: 'Bytes' })
  size: number;
}

/**
 * What a user selected for a movie, a season or an episode: a release, or
 * for a movie or an episode a file in the library
 */
export class RequestSourceDto {
  @ApiProperty({
    type: SelectedReleaseDto,
    required: false,
    description: 'The release the user picked, as it was picked',
  })
  release?: SelectedReleaseDto;

  @ApiProperty({
    required: false,
    description:
      'The id of the file in the library the user picked. The library tells whether it is still there',
  })
  mediaFileId?: string;
}

/** A source of a series: for a season (episode 0) or an episode */
export class EpisodeRequestSourceDto extends IntersectionType(
  EpisodeRefDto,
  RequestSourceDto,
) {}

/** The requests of the user for a series, with the rule and the sources they are fulfilled by */
export class SeriesRequestsDto {
  @ApiProperty({
    type: [MediaRequestDto],
    description: 'In season and episode order',
  })
  requests: MediaRequestDto[];

  @ApiProperty({ type: RequestRuleDto })
  rule: RequestRuleDto;

  @ApiProperty({
    type: [EpisodeRequestSourceDto],
    description:
      'For seasons (episode 0) and episodes, in season and episode order',
  })
  sources: EpisodeRequestSourceDto[];
}

/** The request of the user for a movie, with the rule and the source it is fulfilled by */
export class MovieRequestsDto {
  @ApiProperty({ type: MediaRequestDto, required: false })
  request?: MediaRequestDto;

  @ApiProperty({ type: MovieRequestRuleDto })
  rule: MovieRequestRuleDto;

  @ApiProperty({ type: RequestSourceDto, required: false })
  source?: RequestSourceDto;
}

export class UpdateSeriesRequestsDto {
  @ApiProperty({ type: [EpisodeRefDto] })
  episodes: EpisodeRefDto[];

  @ApiProperty({ description: 'Whether the episodes are requested' })
  requested: boolean;
}

/** A release from an indexer search, or for an episode or a movie a file of it in the library */
export class SetRequestSourceDto {
  @ApiProperty({
    required: false,
    description: 'Id of a release from an indexer search',
  })
  releaseId?: string;

  @ApiProperty({
    required: false,
    description: 'Id of a file of the episode or the movie in the library',
  })
  mediaFileId?: string;
}
