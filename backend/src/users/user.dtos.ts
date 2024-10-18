import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { User } from './user.entity';
import { MyListItemDto } from './my-list/my-list.dtos';
import { plainToInstance } from 'class-transformer';

export class UserDto extends OmitType(User, [
  'password',
  'profilePicture',
  'titles',
  'myListItems',
] as const) {
  @ApiProperty({ type: 'string' })
  profilePicture: string | null;

  @ApiProperty({ type: MyListItemDto, isArray: true })
  myList: MyListItemDto[];

  static fromEntity(entity: User): UserDto {
    return {
      id: entity.id,
      name: entity.name,
      isAdmin: entity.isAdmin,
      settings: entity.settings,
      onboardingDone: entity.onboardingDone,
      profilePicture:
        'data:image;base64,' + entity.profilePicture?.toString('base64'),
      myList: entity.myListItems?.map((i) => plainToInstance(MyListItemDto, i)),
    };
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
  ] as const),
) {
  @ApiProperty({ type: 'string', required: false })
  profilePicture?: string;

  @ApiProperty({ type: 'string', required: false })
  oldPassword?: string;
}

export class SignInDto extends PickType(User, ['name', 'password'] as const) {}
