import { EntityManager } from '@mikro-orm/sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { RequestsService } from '../requests/requests.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { UsersService } from '../users/users.service.js';
import { CleanupSchedule } from './library.dto.js';
import { StorageService } from './storage.service.js';

describe('StorageService', () => {
  let root: string;

  /** The service with a library folder that is there and a movie folder that is not */
  const service = (maxDiskUsagePercent: number | null) =>
    new StorageService(
      {} as EntityManager,
      {} as RequestsService,
      {} as UsersService,
      {
        getOrCreateValue: async () => ({
          movieFolders: { [path.join(root, 'missing')]: { primary: true } },
          seriesFolders: { [root]: { primary: true } },
          cleanup: CleanupSchedule.Daily,
          maxDiskUsagePercent,
        }),
      } as unknown as SettingsService,
    );

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'reiverr-storage-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('is full at the limit, and never without one, leaving out a folder that is not there', async () => {
    expect(await service(null).isDiskFull()).toBe(false);
    expect(await service(100).isDiskFull()).toBe(false);
    expect(await service(0).isDiskFull()).toBe(true);
  });
});
