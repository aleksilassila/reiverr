import { Inject, Injectable } from '@nestjs/common';
import { SourceProvidersService } from 'src/source-providers/source-providers.service';
import { MediaSourcesService } from 'src/users/media-sources/media-sources.service';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto, UserDto } from './user.dto';
import { User } from './user.entity';
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
    private readonly sourceProvidersService: SourceProvidersService,
    private readonly mediaSourcesService: MediaSourcesService,
  ) {}

  // Finds
  async findAll(): Promise<User[]> {
    return this.userRepository
      .find({
        relations: {
          mediaSources: true,
        },
      })
      .then((users) =>
        Promise.all(users.map((user) => this.filterMediaSources(user))),
      );
  }

  async findOne(id: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        mediaSources: true,
      },
    });

    if (!user) return undefined;

    return this.filterMediaSources(user);
  }

  async findOneByName(name: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({
      where: { name },
      relations: {
        mediaSources: true,
      },
    });

    if (!user) return undefined;

    return this.filterMediaSources(user);
  }

  // The rest
  async create(userCreateDto: CreateUserDto): Promise<User | undefined> {
    if (!userCreateDto.name) throw UserServiceError.UsernameRequired;

    const user = this.userRepository.create();
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

    await this.userRepository.save(user);
    return this.findOne(user.id);
  }

  async update(
    userId: string,
    callerUser: User,
    updateUserDto: UpdateUserDto,
  ): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

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

  async getUserDto(
    user: User,
    options: { caller?: User } = {},
  ): Promise<UserDto> {
    const { caller = user } = options;

    const mediaSources = await Promise.all(
      user.mediaSources?.map((m) =>
        this.mediaSourcesService.getMediaSourceDto(m),
      ) ?? [],
    );

    mediaSources.sort(
      (a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity),
    );

    const out = {
      ...user,
      // id: entity.id,
      // name: entity.name,
      // isAdmin: entity.isAdmin,
      // settings: entity.settings,
      // onboardingDone: entity.onboardingDone,
      // mediaSources: entity.mediaSources,
      password: '',
      profilePicture:
        'data:image;base64,' + user.profilePicture?.toString('base64'),
      mediaSources,
      // pluginSettings: entity.pluginSettings,
    };

    delete out.password;

    return out;
  }

  private async filterMediaSources(user: User): Promise<User> {
    const providers = await this.sourceProvidersService.getProviders();

    return {
      ...user,
      mediaSources: user.mediaSources.filter(
        (source) => !!providers[source.pluginId],
      ),
    };
  }
}
