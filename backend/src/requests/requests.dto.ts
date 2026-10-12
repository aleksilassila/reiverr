import { ApiProperty, PickType } from '@nestjs/swagger';
import { EpisodeRefDto } from '../common/common.dto.js';
import { User } from '../users/user.entity.js';
import { RequestRule } from './request-rule.entity.js';
import { MediaRequest } from './request.entity.js';

export class MediaRequestDto extends MediaRequest {}

export class RequesterDto extends PickType(User, ['id', 'name']) {}

export class AdminMediaRequestDto extends MediaRequestDto {
  @ApiProperty({ type: RequesterDto })
  user: RequesterDto;
}

export class MovieRequestDto {
  @ApiProperty()
  tmdbId: string;

  @ApiProperty({ type: MediaRequestDto, required: false })
  request?: MediaRequestDto;
}

export class UpdateMediaRequestDto extends PickType(MediaRequest, [
  'approved',
]) {}

export class RequestRuleDto extends PickType(RequestRule, [
  'keepNext',
  'keepWatched',
  'keepWatchedHours',
]) {}

export class UpdateSeriesRequestsDto {
  @ApiProperty({ type: [EpisodeRefDto] })
  episodes: EpisodeRefDto[];

  @ApiProperty({ description: 'Whether the episodes are requested' })
  requested: boolean;
}

export class SelectReleaseDto {
  @ApiProperty({ description: 'Id of a release from an indexer search' })
  releaseId: string;
}

export class SelectFileDto {
  @ApiProperty({ description: 'Id of a file of the episode in the library' })
  mediaFileId: string;
}
