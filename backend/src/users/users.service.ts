import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import { RequestsService } from '../requests/requests.service.js';
import { CreateUserDto, UpdateUserDto, UserDto } from './user.dto.js';
import { User } from './user.entity.js';

export enum UserServiceError {
  PasswordMismatch = 'PasswordMismatch',
  Unauthorized = 'Unauthorized',
  UsernameRequired = 'UsernameRequired',
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly requestsService: RequestsService,
  ) {}

  // Finds
  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findOne(id: string): Promise<User | undefined> {
    return this.userRepository.findOne({ id });
  }

  async findOneByName(name: string): Promise<User | undefined> {
    return this.userRepository.findOne({ name });
  }

  // The rest
  async create(userCreateDto: CreateUserDto): Promise<User | undefined> {
    if (!userCreateDto.name) throw UserServiceError.UsernameRequired;

    const user = new User();
    user.name = userCreateDto.name;
    // TODO: Hash password
    user.password = userCreateDto.password;
    user.isAdmin = userCreateDto.isAdmin;

    try {
      if (userCreateDto.profilePicture) {
        user.profilePicture = Buffer.from(
          userCreateDto.profilePicture.split(';base64,').pop() as string,
          'base64',
        );
      }
    } catch (e) {
      console.error(e);
    }

    await this.em.persist(user).flush();
    return this.findOne(user.id);
  }

  async update(
    userId: string,
    callerUser: User,
    updateUserDto: UpdateUserDto,
  ): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ id: userId });

    if (!user) throw new Error('Update user: User not found');

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

    await this.em.flush();

    return this.findOne(user.id);
  }

  /** The requests, rules and selections of the user go with it */
  async remove(id: string) {
    return this.em.transactional(async (tx) => {
      await this.requestsService.enqueueTorrentsOfUser(tx, id);

      return tx.nativeDelete(User, { id });
    });
  }

  async noPreviousAdmins(): Promise<boolean> {
    const adminCount = await this.userRepository.count({ isAdmin: true });

    return adminCount === 0;
  }

  async getUserDto(
    user: User,
    options: { caller?: User } = {},
  ): Promise<UserDto> {
    const { caller = user } = options;

    const out = {
      ...user,
      // id: entity.id,
      // name: entity.name,
      // isAdmin: entity.isAdmin,
      // settings: entity.settings,
      // onboardingDone: entity.onboardingDone,
      password: '',
      profilePicture:
        'data:image;base64,' + user.profilePicture?.toString('base64'),
    };

    delete out.password;

    return out;
  }
}
