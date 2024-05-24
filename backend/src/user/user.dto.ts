import { OmitType, PartialType, PickType } from '@nestjs/swagger';
import { User } from './user.entity';

export class UserDto extends OmitType(User, ['password'] as const) {
  static fromEntity(entity: User): UserDto {
    return {
      id: entity.id,
      name: entity.name,
      isAdmin: entity.isAdmin,
      settings: entity.settings,
      onboardingDone: entity.onboardingDone,
    };
  }
}

export class CreateUserDto extends PickType(User, [
  'name',
  'password',
  'isAdmin',
] as const) {}

export class UpdateUserDto extends PartialType(
  PickType(User, ['settings', 'onboardingDone', 'name'] as const),
) {}

export class SignInDto extends PickType(User, ['name', 'password'] as const) {}
