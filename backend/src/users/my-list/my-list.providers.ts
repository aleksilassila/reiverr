import { DataSource } from 'typeorm';
import { DATA_SOURCE } from '../../database/database.providers';
import { MyListItem } from './my-list-item.entity';

export const MY_LIST_REPOSITORY = 'MY_LIST_REPOSITORY';

export const myListProviders = [
  {
    provide: MY_LIST_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(MyListItem),
    inject: [DATA_SOURCE],
  },
];
