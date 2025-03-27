import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { MediaSourceDto } from 'src/users/media-sources/media-source.dto';
import { User } from './user.entity';

export class UserDto extends OmitType(User, [
  'password',
  'profilePicture',
  'mediaSources',
] as const) {
  @ApiProperty({ type: 'string' })
  profilePicture: string | null;

  @ApiProperty({ type: [MediaSourceDto] })
  mediaSources: MediaSourceDto[];
}

export class CreateUserDto extends PickType(User, [
  'name',
  'password',
  'isAdmin',
] as const) {
  @ApiProperty({ type: 'string', required: false })
  profilePicture?: string;
}

export class UpdateUserDto extends PartialType(
  PickType(User, [
    'settings',
    'onboardingDone',
    'name',
    'password',
    'isAdmin',
    // 'pluginSettings',
  ] as const),
) {
  @ApiProperty({ type: 'string', required: false })
  profilePicture?: string;

  @ApiProperty({ type: 'string', required: false })
  oldPassword?: string;
}

export class SignInDto extends PickType(User, ['name', 'password'] as const) {}
