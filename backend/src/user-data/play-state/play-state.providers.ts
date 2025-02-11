import { DataSource } from 'typeorm';
import { PlayState } from './play-state.entity';
import { DATA_SOURCE } from 'src/database/database.providers';

export const USER_PLAY_STATE_REPOSITORY = 'USER_PLAY_STATE_REPOSITORY';

export const playStateProviders = [
  {
    provide: USER_PLAY_STATE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(PlayState),
    inject: [DATA_SOURCE],
  },
];
