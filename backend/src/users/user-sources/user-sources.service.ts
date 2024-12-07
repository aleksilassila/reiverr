import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { CreateSourceDto } from './user-source.dto';
import { USER_REPOSITORY, USER_SOURCE_REPOSITORY } from '../user.providers';
import { MediaSource } from './user-source.entity';
import { UsersService } from '../users.service';

export enum UserSourcesServiceError {
  SourceNotFound = 'SourceNotFound',
  Unauthorized = 'Unauthorized',
}

@Injectable()
export class UserSourcesService {
  constructor(
    private readonly userService: UsersService,
    @Inject(USER_SOURCE_REPOSITORY)
    private readonly userSourceRepository: Repository<MediaSource>,
  ) {}

  private async findUserSource(
    userId: string,
    sourceId: string,
  ): Promise<MediaSource> {
    const source = await this.userSourceRepository.findOne({
      where: {
        id: sourceId,
        userId: userId,
      },
    });

    return source;
  }

  async deleteUserSource(
    userId: string,
    sourceId: string,
    callerUser: User,
  ): Promise<User> {
    if (!callerUser.isAdmin || callerUser.id !== userId) {
      throw UserSourcesServiceError.Unauthorized;
    }

    const source = await this.findUserSource(userId, sourceId);

    if (!source) {
      throw UserSourcesServiceError.SourceNotFound;
    }

    await this.userSourceRepository.remove(source);
    return this.userService.findOne(userId);
  }

  async updateUserSource(
    user: User,
    sourceId: string,
    sourceDto: CreateSourceDto,
    callerUser: User = user,
  ): Promise<User> {
    if (!callerUser.isAdmin || callerUser.id !== user.id) {
      throw UserSourcesServiceError.Unauthorized;
    }

    let source = await this.findUserSource(user.id, sourceId);

    // Create new if doesn't exist
    if (!source) {
      source = new MediaSource();
      source.user = user;
      source.id = sourceId;
      source.adminControlled = false;
    }

    // Check for unauthorized access
    if (source.adminControlled && !callerUser.isAdmin) {
      throw UserSourcesServiceError.Unauthorized;
    } else if (sourceDto.adminControlled !== undefined && !callerUser.isAdmin) {
      throw UserSourcesServiceError.Unauthorized;
    }

    source.adminControlled =
      sourceDto.adminControlled ?? source.adminControlled;
    source.enabled = sourceDto.enabled ?? source.enabled;
    source.pluginSettings = sourceDto.pluginSettings ?? source.pluginSettings;

    await this.userSourceRepository.save(source);
    return this.userService.findOne(user.id);
  }

  getSourceSettings(user: User, sourceId: string) {
    return user.mediaSources
      ?.filter((s) => s?.enabled)
      ?.find((source) => source.id === sourceId)?.pluginSettings;
  }
}
