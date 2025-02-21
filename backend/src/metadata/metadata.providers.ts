import { DataSource } from 'typeorm';
import { MovieMetadata, SeriesMetadata } from './metadata.entity';
import { DATA_SOURCE } from 'src/database/database.providers';

export const MOVIE_REPOSITORY = 'MOVIE_REPOSITORY';
export const SERIES_REPOSITORY = 'SERIES_REPOSITORY';

export const metadataProviders = [
  {
    provide: MOVIE_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(MovieMetadata),
    inject: [DATA_SOURCE],
  },
  {
    provide: SERIES_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SeriesMetadata),
    inject: [DATA_SOURCE],
  },
];
