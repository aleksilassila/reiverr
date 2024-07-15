import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './user.dtos';
import { USER_REPOSITORY } from './user.providers';

export enum UserServiceError {
  PasswordMismatch = 'PasswordMismatch',
  Unauthorized = 'Unauthorized',
  UsernameRequired = 'UsernameRequired',
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findOneByName(name: string): Promise<User> {
    return this.userRepository.findOne({ where: { name } });
  }

  async create(userCreateDto: CreateUserDto): Promise<User> {
    if (!userCreateDto.name) throw UserServiceError.UsernameRequired;

    const user = this.userRepository.create();
    user.name = userCreateDto.name;
    // TODO: Hash password
    user.password = userCreateDto.password;
    user.isAdmin = userCreateDto.isAdmin;

    try {
      user.profilePicture = Buffer.from(
        userCreateDto.profilePicture.split(';base64,').pop() as string,
        'base64',
      );
    } catch (e) {
      console.error(e);
    }

    return this.userRepository.save(user);
  }

  async update(
    user: User,
    callerUser: User,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    if (updateUserDto.name) user.name = updateUserDto.name;

    if (updateUserDto.oldPassword !== updateUserDto.password) {
      if (
        updateUserDto.password !== undefined &&
        updateUserDto.oldPassword !== user.password
      )
        throw UserServiceError.PasswordMismatch;
      else if (updateUserDto.password !== undefined)
        user.password = updateUserDto.password;
    }

    if (updateUserDto.settings) user.settings = updateUserDto.settings;
    if (updateUserDto.onboardingDone)
      user.onboardingDone = updateUserDto.onboardingDone;
    if (updateUserDto.profilePicture) {
      try {
        user.profilePicture = Buffer.from(
          updateUserDto.profilePicture.split(';base64,').pop() as string,
          'base64',
        );
      } catch (e) {
        console.error(e);
      }
    }
    if (updateUserDto.isAdmin !== undefined && callerUser.isAdmin)
      user.isAdmin = updateUserDto.isAdmin;

    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async noPreviousAdmins(): Promise<boolean> {
    const adminCount = await this.userRepository.count({
      where: { isAdmin: true },
    });

    return adminCount === 0;
  }
}
