import { DataSource } from 'typeorm';
import { MediaSource } from './media-source.entity';
import { DATA_SOURCE } from 'src/database/database.providers';

export const MEIDA_SOURCE_REPOSITORY = 'USER_SOURCE_REPOSITORY';

export const mediaSourceProviders = [
  {
    provide: MEIDA_SOURCE_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(MediaSource),
    inject: [DATA_SOURCE],
  },
];
