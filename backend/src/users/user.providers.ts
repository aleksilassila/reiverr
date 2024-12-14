import { DataSource } from 'typeorm';
import { User } from './user.entity';
import { DATA_SOURCE } from '../database/database.providers';
import { MediaSource } from './user-sources/user-source.entity';
import { PlayState } from './play-state/play-state.entity';
import { LibraryItem } from './library/library.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';
export const USER_SOURCE_REPOSITORY = 'USER_SOURCE_REPOSITORY';
export const USER_LIBRARY_REPOSITORY = 'USER_LIBRARY_REPOSITORY';
export const USER_PLAY_STATE_REPOSITORY = 'USER_PLAY_STATE_REPOSITORY';

export const userProviders = [
  {
    provide: USER_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: [DATA_SOURCE],
  },
  {
    provide: USER_SOURCE_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(MediaSource),
    inject: [DATA_SOURCE],
  },
  {
    provide: USER_PLAY_STATE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(PlayState),
    inject: [DATA_SOURCE],
  },
  {
    provide: USER_LIBRARY_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(LibraryItem),
    inject: [DATA_SOURCE],
  },
];
