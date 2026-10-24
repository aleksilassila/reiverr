import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { MediaType } from '../../common/common.dto.js';
import {
  MovieMetadata,
  SeriesMetadata,
} from '../../metadata/metadata.entity.js';
import { MetadataService } from '../../metadata/metadata.service.js';
import mikroOrmConfig from '../../mikro-orm.config.js';
import { User } from '../../users/user.entity.js';
import { PlayState } from '../play-state/play-state.entity.js';
import { MyListItem } from './my-list-item.entity.js';
import { MyListService } from './my-list.service.js';

// Movies and series have separate id ranges on TMDB that overlap
const TMDB_ID = '1';

describe('MyListService', () => {
  let orm: MikroORM;
  let myList: MyListService;
  let userId: string;

  // Every call gets its own entity manager, as every HTTP request does
  const request = <T>(run: () => Promise<T>) =>
    RequestContext.create(orm.em, run);

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const user = new User();
    user.name = 'user';
    user.password = '';
    await orm.em.fork().insert(user);
    userId = user.id;

    myList = new MyListService(
      orm.em.getRepository(MyListItem),
      orm.em.getRepository(PlayState),
      orm.em,
      new MetadataService(
        orm.em.getRepository(MovieMetadata),
        orm.em.getRepository(SeriesMetadata),
        orm.em,
        undefined,
      ),
    );

    for (const mediaType of [MediaType.Series, MediaType.Movie]) {
      await request(() =>
        myList.findOrCreateByTmdbId(userId, TMDB_ID, mediaType),
      );
    }
  });

  afterEach(() => orm.close());

  it('keeps a movie and a series with the same TMDB id apart', async () => {
    const find = (mediaType: MediaType) =>
      request(() => myList.findByTmdbId(userId, TMDB_ID, mediaType));

    expect((await find(MediaType.Movie)).mediaType).toBe(MediaType.Movie);
    expect((await find(MediaType.Series)).mediaType).toBe(MediaType.Series);

    await request(() =>
      myList.deleteByTmdbId(userId, TMDB_ID, MediaType.Movie),
    );

    expect(await find(MediaType.Movie)).toBeNull();
    expect(await find(MediaType.Series)).not.toBeNull();
  });
});
