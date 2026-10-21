import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/sqlite';
import { DEV } from './consts.js';
import { TorrentItem } from './downloads/torrent-item.entity.js';
import { Torrent } from './downloads/torrent.entity.js';
import { Job } from './jobs/job.entity.js';
import { MediaFile } from './library/media-file.entity.js';
import { RequestBinding } from './library/request-binding.entity.js';
import { LogEntry } from './server-log/log-entry.entity.js';
import { RequestRule } from './requests/request-rule.entity.js';
import { MediaRequest } from './requests/request.entity.js';
import { SelectedRelease } from './requests/selected-release.entity.js';
import { MovieMetadata, SeriesMetadata } from './metadata/metadata.entity.js';
import { Settings } from './settings/settings.entity.js';
import { MyListItem } from './user-data/my-list/my-list-item.entity.js';
import { PlayState } from './user-data/play-state/play-state.entity.js';
import { User } from './users/user.entity.js';

export default defineConfig({
  dbName: `./config/reiverr${DEV ? '.dev' : ''}.sqlite`,
  entities: [
    Job,
    MyListItem,
    LogEntry,
    MediaFile,
    MediaRequest,
    MovieMetadata,
    PlayState,
    RequestBinding,
    RequestRule,
    SelectedRelease,
    SeriesMetadata,
    Settings,
    Torrent,
    TorrentItem,
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
