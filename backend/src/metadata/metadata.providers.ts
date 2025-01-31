import { DataSource } from 'typeorm';
import { Movie } from './metadata.entity';
import { DATA_SOURCE } from 'src/database/database.providers';

export const MOVIE_REPOSITORY = 'MOVIE_REPOSITORY';

export const metadataProviders = [
  {
    provide: MOVIE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Movie),
    inject: [DATA_SOURCE],
  },
];
