import { DataSource } from 'typeorm';
import { CsnInstance, CsnInvite, CsnPeer } from './csn.entity';
import { DATA_SOURCE } from '../database/database.providers';

export const CSN_PEER_CLIENT = 'CSN_PEER_CLIENT';
export const CSN_PEER_REPOSITORY = 'CSN_PEER_REPOSITORY';
export const CSN_INSTANCE_REPOSITORY = 'CSN_INSTANCE_REPOSITORY';
export const CSN_INVITE_REPOSITORY = 'CSN_INVITE_REPOSITORY';

export const csnProviders = [
  // {
  //   provide: CSN_PEER_CLIENT,
  //   useFactory: (dataSource: DataSource) => dataSource.getClient(),
  //   inject: [DATA_SOURCE],
  // },
  {
    provide: CSN_PEER_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(CsnPeer),
    inject: [DATA_SOURCE],
  },
  {
    provide: CSN_INSTANCE_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(CsnInstance),
    inject: [DATA_SOURCE],
  },
  {
    provide: CSN_INVITE_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(CsnInvite),
    inject: [DATA_SOURCE],
  },
];
