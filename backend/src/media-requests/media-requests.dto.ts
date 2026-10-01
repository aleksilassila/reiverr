import { ApiProperty, PickType } from '@nestjs/swagger';
import { User } from '../users/user.entity.js';
import { MediaRequest } from './media-request.entity.js';

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
