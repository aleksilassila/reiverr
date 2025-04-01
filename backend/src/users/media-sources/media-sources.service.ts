import {
  MediaSourceProvider,
  ValidationResponse,
} from '@aleksilassila/reiverr-plugin';
import { Inject, Injectable } from '@nestjs/common';
import { SourceProvidersService } from 'src/source-providers/source-providers.service';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import {
  MediaSourceDto,
  UpdateOrCreateMediaSourceDto,
} from './media-source.dto';
import { MediaSource } from './media-source.entity';
import { MEIDA_SOURCE_REPOSITORY } from './media-source.providers';

export enum MediaSourcesServiceError {
  SourceNotFound = 'SourceNotFound',
  Unauthorized = 'Unauthorized',
}

@Injectable()
export class MediaSourcesService {
  constructor(
    @Inject(MEIDA_SOURCE_REPOSITORY)
    private readonly mediaSourceRepository: Repository<MediaSource>,
    private sourceProvidersService: SourceProvidersService,
  ) {}

  private async findUserMediaSources(userId: string): Promise<MediaSource[]> {
    return this.mediaSourceRepository.find({
      where: {
        userId: userId,
      },
    });
  }

  async findMediaSource(sourceId: string): Promise<MediaSource> {
    const source = await this.mediaSourceRepository.findOne({
      where: {
        id: sourceId,
      },
    });

    return source;
  }

  async deleteMediaSource(sourceId: string, callerUser: User) {
    const source = await this.findMediaSource(sourceId);

    if (!source) {
      throw MediaSourcesServiceError.SourceNotFound;
    }

    if (source.userId !== callerUser.id && !callerUser.isAdmin) {
      throw MediaSourcesServiceError.Unauthorized;
    }

    await this.mediaSourceRepository.remove(source);
  }

  async updateOrCreateMediaSource(
    user: User,
    sourceDto: UpdateOrCreateMediaSourceDto,
    callerUser: User = user,
  ) {
    if (!callerUser.isAdmin || callerUser.id !== user.id) {
      throw MediaSourcesServiceError.Unauthorized;
    }

    const sources = await this.findUserMediaSources(user.id);
    let source = sources.find((s) => s.id === sourceDto.id);

    // Create new if doesn't exist
    if (!source) {
      if (!sourceDto.pluginId)
        throw new Error('Plugin ID is required when creating a new source');

      source = new MediaSource();
      source.user = user;
      source.pluginId = sourceDto.pluginId;
      source.adminControlled = false;
      source.name = sourceDto.name ?? sourceDto.pluginId;
      source.priority = sourceDto.priority ?? sources.length;
    }

    // Check for unauthorized access
    if (source.adminControlled && !callerUser.isAdmin) {
      throw MediaSourcesServiceError.Unauthorized;
    } else if (sourceDto.adminControlled !== undefined && !callerUser.isAdmin) {
      throw MediaSourcesServiceError.Unauthorized;
    }

    source.adminControlled =
      sourceDto.adminControlled ?? source.adminControlled;
    let validationResponse: ValidationResponse | undefined;
    if (sourceDto.pluginSettings !== undefined) {
      let valid = false;
      const provider = this.sourceProvidersService.getPlugin(source.pluginId);

      if (provider) {
        validationResponse = await provider.validateSettings({
          settings: sourceDto.pluginSettings,
        });
        valid = validationResponse.isValid;
        source.pluginSettings = validationResponse.settings;
      } else {
        source.pluginSettings = sourceDto.pluginSettings;
      }

      source.enabled = !!valid;
    }
    source.name = sourceDto.name ?? source.name;

    let priority = 0;
    for (const other of sources.sort((a, b) => a.priority - b.priority)) {
      if (other.id === source.id) continue;

      if (source.priority === priority) {
        priority++;
      }

      if (other.priority !== priority) {
        other.priority = priority;
        await this.mediaSourceRepository.save(other);
      }

      priority++;
    }

    return {
      mediaSource: await this.mediaSourceRepository.save(source),
      validationResponse,
    };
  }

  getMediaSourceSettings(user: User, sourceId: string) {
    return user.mediaSources
      ?.filter((s) => s?.enabled)
      ?.find((source) => source.id === sourceId)?.pluginSettings;
  }

  async getConnection(options: {
    sourceId: string;
    token: string;
    userId: string;
  }): Promise<
    | {
        provider: MediaSourceProvider;
        mediaSource: MediaSource;
      }
    | undefined
  > {
    const { sourceId, token, userId } = options;

    const mediaSource = await this.findMediaSource(sourceId);

    const provider = this.sourceProvidersService
      .getPlugin(mediaSource.pluginId)
      .getMediaSourceProvider({
        settings: mediaSource.pluginSettings,
        sourceId,
        token,
        userId,
      });

    if (provider && mediaSource) {
      return { provider, mediaSource };
    }

    return undefined;
  }

  async getMediaSourceDto(mediaSource: MediaSource): Promise<MediaSourceDto> {
    const sourceProvider = this.sourceProvidersService.getPlugin(
      mediaSource.pluginId,
    );

    const catalogueProvider = sourceProvider?.getMediaSourceProvider({
      userId: '',
      settings: {},
      sourceId: '',
      token: '',
    });

    const moviesCatalogue = !!catalogueProvider?.getMovieCatalogue;
    const seriesCatalogue = !!catalogueProvider?.getSeriesCatalogue;
    const combinedCatalogue = !!catalogueProvider?.getCatalogue;
    const missingCatalogue = !!catalogueProvider?.getMissingInCatalogue;
    const sortOptions = catalogueProvider?.getOrderOptions();

    return {
      ...mediaSource,
      enabled: mediaSource.enabled && !!sourceProvider,
      capabilities: {
        catalogues:
          moviesCatalogue ||
          seriesCatalogue ||
          combinedCatalogue ||
          missingCatalogue,
        moviesCatalogue,
        seriesCatalogue,
        combinedCatalogue,
        missingCatalogue,
        sortOptions: (await sortOptions) ?? [],
      },
    };
  }
}
