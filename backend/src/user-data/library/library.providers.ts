import { DataSource } from 'typeorm';
import { LibraryItem } from './library.entity';
import { DATA_SOURCE } from 'src/database/database.providers';

export const USER_LIBRARY_REPOSITORY = 'USER_LIBRARY_REPOSITORY';

export const libraryProviders = [
  {
    provide: USER_LIBRARY_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(LibraryItem),
    inject: [DATA_SOURCE],
  },
];
