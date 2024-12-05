import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './user.dto';

export enum UserServiceError {
  PasswordMismatch = 'PasswordMismatch',
  Unauthorized = 'Unauthorized',
  UsernameRequired = 'UsernameRequired',
}

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
  ) {}

  // Finds
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: {
        mediaSources: true,
      },
    });
  }

  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne({
      where: { id },
      relations: {
        mediaSources: true,
      },
    });
  }

  async findOneByName(name: string): Promise<User> {
    return this.userRepository.findOne({
      where: { name },
      relations: {
        mediaSources: true,
      },
    });
  }

  // The rest
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

    await this.userRepository.save(user);
    return this.findOne(user.id);
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
      ) {
        throw UserServiceError.PasswordMismatch;
      } else if (updateUserDto.password !== undefined) {
        user.password = updateUserDto.password;
      }
    }

    if (updateUserDto.settings) user.settings = updateUserDto.settings;

    // if (updateUserDto.pluginSettings) {
    //   for (const key of Object.keys(updateUserDto.pluginSettings)) {
    //     user.pluginSettings[key] = updateUserDto.pluginSettings[key];
    //   }
    // }

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

    await this.userRepository.save(user);

    return this.findOne(user.id);
  }

  async remove(id: string) {
    return await this.userRepository.delete(id);
  }

  async noPreviousAdmins(): Promise<boolean> {
    const adminCount = await this.userRepository.count({
      where: { isAdmin: true },
    });

    return adminCount === 0;
  }
}
