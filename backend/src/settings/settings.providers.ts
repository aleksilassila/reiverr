import { DataSource } from 'typeorm';
import { DATA_SOURCE } from '../database/database.providers';
import { Settings } from './settings.entity';

export const SETTINGS_REPOSITORY = 'SETTINGS_REPOSITORY';

export const settingsProviders = [
  {
    provide: SETTINGS_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Settings),
    inject: [DATA_SOURCE],
  },
];
