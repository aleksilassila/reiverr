import { DataSource } from 'typeorm';
import { Movie, Series } from './metadata.entity';
import { DATA_SOURCE } from 'src/database/database.providers';

export const MOVIE_REPOSITORY = 'MOVIE_REPOSITORY';
export const SERIES_REPOSITORY = 'SERIES_REPOSITORY';

export const metadataProviders = [
  {
    provide: MOVIE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Movie),
    inject: [DATA_SOURCE],
  },
  {
    provide: SERIES_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Series),
    inject: [DATA_SOURCE],
  },
];
