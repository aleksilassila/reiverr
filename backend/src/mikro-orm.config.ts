import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/sqlite';
import { DEV } from './consts.js';
import { TorrentSelection } from './downloads/torrent-selection.entity.js';
import { Job } from './jobs/job.entity.js';
import { MediaRequest } from './media-requests/media-request.entity.js';
import { MovieMetadata, SeriesMetadata } from './metadata/metadata.entity.js';
import { Settings } from './settings/settings.entity.js';
import { LibraryItem } from './user-data/library/library.entity.js';
import { PlayState } from './user-data/play-state/play-state.entity.js';
import { MediaSource } from './users/media-sources/media-source.entity.js';
import { User } from './users/user.entity.js';

export default defineConfig({
  dbName: `./config/reiverr${DEV ? '.dev' : ''}.sqlite`,
  entities: [
    Job,
    LibraryItem,
    MediaRequest,
    MediaSource,
    MovieMetadata,
    PlayState,
    SeriesMetadata,
    Settings,
    TorrentSelection,
    User,
  ],
  metadataProvider: ReflectMetadataProvider,
  extensions: [Migrator],
  migrations: {
    path: './dist/src/migrations',
    pathTs: './src/migrations',
    snapshotName: '.snapshot-reiverr',
    snapshotOnMigrate: false,
  },
});
