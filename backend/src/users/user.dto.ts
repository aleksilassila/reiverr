import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { User } from './user.entity';
import { PlayStateDto } from './play-state/play-state.dto';

export class UserDto extends OmitType(User, [
  'password',
  'profilePicture',
] as const) {
  @ApiProperty({ type: 'string' })
  profilePicture: string | null;

  static fromEntity(entity: User, caller: User = entity): UserDto {
    const out = {
      ...entity,
      // id: entity.id,
      // name: entity.name,
      // isAdmin: entity.isAdmin,
      // settings: entity.settings,
      // onboardingDone: entity.onboardingDone,
      // mediaSources: entity.mediaSources,
      password: '',
      profilePicture:
        'data:image;base64,' + entity.profilePicture?.toString('base64'),
      // pluginSettings: entity.pluginSettings,
    };

    delete out.password;

    return out;
  }
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

export class MovieUserDataDto {
  @ApiProperty()
  tmdbId: string;

  @ApiProperty()
  inLibrary: boolean;

  @ApiProperty({ type: PlayStateDto, required: false })
  playState?: PlayStateDto;
}

export class SeriesUserDataDto {
  @ApiProperty()
  tmdbId: string;

  @ApiProperty()
  inLibrary: boolean;

  @ApiProperty({ type: [PlayStateDto] })
  playStates: PlayStateDto[];
}
