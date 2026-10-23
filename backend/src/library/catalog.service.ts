import { EntityManager, sql } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import {
  MediaType,
  OrderDirection,
  PaginatedResponseDto,
  PaginationDto,
} from '../common/common.dto.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { PlayStatesService } from '../user-data/play-state/play-states.service.js';
import {
  LibraryTitleDto,
  LibraryTitlesOrder,
  LibraryTitlesStatus,
} from './library.dto.js';
import { MediaFile } from './media-file.entity.js';

/** The direction each order of the titles reads in when none is asked for */
const NATURAL: Record<LibraryTitlesOrder, OrderDirection> = {
  [LibraryTitlesOrder.DateAdded]: OrderDirection.Desc,
  [LibraryTitlesOrder.Name]: OrderDirection.Asc,
  [LibraryTitlesOrder.FirstReleaseDate]: OrderDirection.Desc,
  [LibraryTitlesOrder.LastReleaseDate]: OrderDirection.Desc,
};

/**
 * The titles that have files in the library, as the library page lists
 * them: with whether the user has requests for them, so that those come
 * first
 */
@Injectable()
export class CatalogService {
  constructor(
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
    private readonly playStatesService: PlayStatesService,
  ) {}

  async findTitles(
    userId: string,
    options: {
      mediaType?: MediaType;
      status?: LibraryTitlesStatus;
      order: LibraryTitlesOrder;
      direction?: OrderDirection;
      pagination: PaginationDto;
    },
  ): Promise<PaginatedResponseDto<LibraryTitleDto>> {
    const em = this.em.fork();
    const { page, itemsPerPage } = options.pagination;

    // Whether the user has a request for the title of the file
    const requested = sql`exists (
      select 1 from request r
      where r.user_id = ${userId} and r.tmdb_id = mf.tmdb_id
        and r.media_type = case mf.media_type when 'movie' then 'movie' else 'episode' end
    )`;
    const titles = () => {
      const builder = em
        .createQueryBuilder(MediaFile, 'mf')
        .leftJoin(sql.ref('movie_metadata'), 'mm', {
          'mm.tmdb_id': sql.ref('mf.tmdb_id'),
          'mf.media_type': MediaType.Movie,
        })
        .leftJoin(sql.ref('series_metadata'), 'sm', {
          'sm.tmdb_id': sql.ref('mf.tmdb_id'),
          'mf.media_type': MediaType.Series,
        });
      if (options.mediaType) {
        builder.andWhere({ mediaType: options.mediaType });
      }
      if (options.status === LibraryTitlesStatus.Requested) {
        builder.andWhere(requested);
      } else if (options.status === LibraryTitlesStatus.Unrequested) {
        builder.andWhere(sql`not ${requested}`);
      }

      return builder;
    };

    const { total } = await titles()
      .select(sql`count(distinct mf.media_type || ':' || mf.tmdb_id) as total`)
      .execute<{ total: number }>('get');

    const direction = options.direction ?? NATURAL[options.order];
    const sortKey = {
      [LibraryTitlesOrder.DateAdded]: sql`max(mf.created_at)`,
      [LibraryTitlesOrder.Name]: sql`coalesce(sm.name, mm.name)`,
      [LibraryTitlesOrder.FirstReleaseDate]: sql`coalesce(mm.release_date, sm.first_release_date)`,
      [LibraryTitlesOrder.LastReleaseDate]: sql`coalesce(mm.release_date, sm.last_release_date)`,
    }[options.order];
    const rows = await titles()
      .select(['mf.mediaType', 'mf.tmdbId', sql`${requested} as requested`])
      .groupBy(['mf.mediaType', 'mf.tmdbId'])
      .orderBy({ [sortKey]: direction, [sql`mf.tmdb_id`]: 'asc' })
      .limit(itemsPerPage)
      .offset(itemsPerPage * (page - 1))
      .execute<{ mediaType: MediaType; tmdbId: string; requested: number }[]>();

    const lastPlayed = await this.playStatesService.findLastPlayed(
      userId,
      rows,
    );
    const items: LibraryTitleDto[] = [];
    for (const row of rows) {
      const lastPlayState = lastPlayed.get(`${row.mediaType}:${row.tmdbId}`);
      items.push({
        mediaType: row.mediaType,
        tmdbId: row.tmdbId,
        tmdbItem: await this.metadataService.getTmdbItem(
          row.tmdbId,
          row.mediaType,
        ),
        requested: !!row.requested,
        ...(lastPlayState && { lastPlayState }),
      });
    }

    return { items, total, page, itemsPerPage };
  }
}
