import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { User } from 'src/users/user.entity';
import { MediaRequest } from './media-request.entity';

export class MediaRequestDto extends OmitType(MediaRequest, ['user']) {}

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
