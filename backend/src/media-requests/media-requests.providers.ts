import { DataSource } from 'typeorm';
import { DATA_SOURCE } from 'src/database/database.providers';
import { MediaRequest } from './media-request.entity';

export const MEDIA_REQUEST_REPOSITORY = 'MEDIA_REQUEST_REPOSITORY';

export const mediaRequestProviders = [
  {
    provide: MEDIA_REQUEST_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(MediaRequest),
    inject: [DATA_SOURCE],
  },
];
