import { EntityManager } from '@mikro-orm/sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { RequestsService } from '../requests/requests.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { UsersService } from '../users/users.service.js';
import { CleanupSchedule } from './library.dto.js';
import { expectedBytes, roomFor, StorageService } from './storage.service.js';

describe('roomFor', () => {
  const usage = 90;
  const gate = (quota: number | null, diskFull = false) => ({
    usage,
    quota,
    diskFull,
  });

  it('lets a request through within the quota, or without one', () => {
    expect(roomFor(gate(null), { bytes: 1000, download: true })).toBe('ok');
    expect(roomFor(gate(100), { bytes: 10, download: true })).toBe('ok');
    expect(roomFor(gate(100), { bytes: 11, download: false })).toBe(
      'over-quota',
    );
  });

  it('holds back a download while a disk is at the limit, and a file in the library not', () => {
    expect(roomFor(gate(null, true), { bytes: 10, download: true })).toBe(
      'disk-full',
    );
    expect(roomFor(gate(null, true), { bytes: 10, download: false })).toBe(
      'ok',
    );
    // The quota is what the user can do something about
    expect(roomFor(gate(100, true), { bytes: 11, download: true })).toBe(
      'over-quota',
    );
  });
});

describe('expectedBytes', () => {
  it('is the release for a torrent picked for the episode, else its share of the season', () => {
    expect(expectedBytes(200, true, 3)).toBe(200);
    expect(expectedBytes(200, false, 3)).toBe(67);
    expect(expectedBytes(200, false, undefined)).toBe(200);
    expect(expectedBytes(200, false, 0)).toBe(200);
  });
});

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
