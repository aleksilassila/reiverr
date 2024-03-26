import { DataSource } from 'typeorm';
import { User } from './user.entity';
import { DATA_SOURCE } from '../database/database.providers';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export const userProviders = [
  {
    provide: USER_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: [DATA_SOURCE],
  },
];
