import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/sqlite';
import { DEV } from './consts.js';
import { TorrentSelection } from './requests/torrent-selection.entity.js';
import { Torrent } from './downloads/torrent.entity.js';
import { Job } from './jobs/job.entity.js';
import { MediaFile } from './local-media/media-file.entity.js';
import { LogEntry } from './server-log/log-entry.entity.js';
import { RequestRule } from './requests/request-rule.entity.js';
import { MediaRequest } from './requests/request.entity.js';
import { MovieMetadata, SeriesMetadata } from './metadata/metadata.entity.js';
import { Settings } from './settings/settings.entity.js';
import { LibraryItem } from './user-data/library/library.entity.js';
import { PlayState } from './user-data/play-state/play-state.entity.js';
import { User } from './users/user.entity.js';

export default defineConfig({
  dbName: `./config/reiverr${DEV ? '.dev' : ''}.sqlite`,
  entities: [
    Job,
    LibraryItem,
    LogEntry,
    MediaFile,
    MediaRequest,
    MovieMetadata,
    PlayState,
    RequestRule,
    SeriesMetadata,
    Settings,
    Torrent,
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
