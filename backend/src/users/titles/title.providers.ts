import { DataSource } from 'typeorm';
import { DATA_SOURCE } from '../../database/database.providers';
import { Title } from './title.entity';
import { Media } from './media.entity';

export const TITLE_REPOSITORY = 'PLAY_STATE_REPOSITORY';
export const MEDIA_REPOSITORY = 'MEDIA_REPOSITORY';

export const titleProviders = [
  {
    provide: TITLE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Title),
    inject: [DATA_SOURCE],
  },
  {
    provide: MEDIA_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Media),
    inject: [DATA_SOURCE],
  },
];
