import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { User } from './user.entity.js';

export class UserDto extends OmitType(User, [
  'passwordHash',
  'profilePicture',
] as const) {
  @ApiProperty({ type: 'string' })
  profilePicture: string | null;
}

export class CreateUserDto extends PickType(User, [
  'name',
  'isAdmin',
] as const) {
  @ApiProperty({ required: true })
  password: string;

  @ApiProperty({ type: 'string', required: false })
  profilePicture?: string;
}

export class UpdateUserDto extends PartialType(
  PickType(User, [
    'settings',
    'onboardingDone',
    'name',
    'isAdmin',
    'quotaBytes',
  ] as const),
) {
  @ApiProperty({ type: 'string', required: false })
  password?: string;

  @ApiProperty({ type: 'string', required: false })
  profilePicture?: string;

  @ApiProperty({ type: 'string', required: false })
  oldPassword?: string;
}

export class SignInDto extends PickType(User, ['name'] as const) {
  @ApiProperty({ required: true })
  password: string;
}
