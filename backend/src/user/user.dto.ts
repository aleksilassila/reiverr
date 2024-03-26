import { OmitType, PickType } from '@nestjs/swagger';
import { User } from './user.entity';

export class UserDto extends OmitType(User, ['password'] as const) {
  static fromEntity(entity: User): UserDto {
    return {
      id: entity.id,
      name: entity.name,
      isAdmin: entity.isAdmin,
      settings: entity.settings,
    };
  }
}

export class CreateUserDto extends PickType(User, [
  'name',
  'password',
  'isAdmin',
] as const) {}

export class UpdateUserDto extends OmitType(User, ['id'] as const) {}
