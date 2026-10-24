import { CreateRequestContext } from '@mikro-orm/decorators/legacy';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { MediaType, MediaTypeFull } from '../../common/common.dto.js';
import { MetadataService } from '../../metadata/metadata.service.js';
import { PlayState } from '../play-state/play-state.entity.js';
import { MyListItem } from './my-list-item.entity.js';

/** The titles a user put on their list; the catalog lists them */
@Injectable()
export class MyListService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MyListService.name);

  constructor(
    @InjectRepository(MyListItem)
    private readonly myListRepository: EntityRepository<MyListItem>,
    @InjectRepository(PlayState)
    private readonly playStateRepository: EntityRepository<PlayState>,
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
  ) {}

  @CreateRequestContext()
  async onApplicationBootstrap() {
    // Make sure library items are cached
    const items = await this.myListRepository.findAll();

    items.forEach((i) => {
      const metadata =
        i.mediaType === 'movie'
          ? this.metadataService.getMovieByTmdbId(i.tmdbId)
          : this.metadataService.getSeriesByTmdbId(i.tmdbId);

      metadata.catch((e) =>
        this.logger.warn(
          `Failed to cache ${i.mediaType} ${i.tmdbId}: ${e.message}`,
        ),
      );
    });
  }

  async findByTmdbId(
    userId: string,
    tmdbId: string,
    mediaType: MediaType,
  ): Promise<MyListItem | null> {
    return this.myListRepository.findOne({ userId, tmdbId, mediaType });
  }

  async findOrCreateByTmdbId(
    userId: string,
    tmdbId: string,
    mediaType: MediaType,
  ): Promise<MyListItem> {
    let myListItem = await this.findByTmdbId(userId, tmdbId, mediaType);

    if (!myListItem) {
      myListItem = new MyListItem();
      myListItem.userId = userId;
      myListItem.tmdbId = tmdbId;
      myListItem.mediaType = mediaType;

      const lastPlayedAt = await this.playStateRepository
        .find({ userId, tmdbId, mediaType: playStateMediaType(mediaType) })
        .then((states) =>
          states.map((s) => new Date(s.lastPlayedAt).getTime() || 0),
        )
        .then((dates) => Math.max(0, ...dates));

      if (lastPlayedAt) {
        myListItem.lastPlayedAt = new Date(lastPlayedAt);
      }

      await this.em.persist(myListItem).flush();
    }

    return myListItem;
  }

  async deleteByTmdbId(userId: string, tmdbId: string, mediaType: MediaType) {
    return await this.myListRepository.nativeDelete({
      userId,
      tmdbId,
      mediaType,
    });
  }
}

// The play states of a series are those of its episodes
function playStateMediaType(mediaType: MediaType): MediaTypeFull {
  return mediaType === MediaType.Movie
    ? MediaTypeFull.Movie
    : MediaTypeFull.Episode;
}
