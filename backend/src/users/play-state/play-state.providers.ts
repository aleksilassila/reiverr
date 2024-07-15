import { DataSource } from 'typeorm';
import { DATA_SOURCE } from '../../database/database.providers';
import { PlayState } from './play-state.entity';

export const PLAY_STATE_REPOSITORY = 'PLAY_STATE_REPOSITORY';

export const playStateProviders = [
  {
    provide: PLAY_STATE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(PlayState),
    inject: [DATA_SOURCE],
  },
];
