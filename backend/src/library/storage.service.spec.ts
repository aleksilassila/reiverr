import { EntityManager } from '@mikro-orm/sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { RequestsService } from '../requests/requests.service.js';
import { UsersService } from '../users/users.service.js';
import { CleanupSchedule } from './library.dto.js';
import { LibraryService } from './library.service.js';
import { expectedBytes, roomFor, StorageService } from './storage.service.js';

describe('roomFor', () => {
  const usage = { heldBytes: 60, pendingBytes: 30 };
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

  /** The service with a library folder that is there and a movie folder that is not, and no users or requests */
  const service = (maxDiskUsagePercent: number | null) =>
    new StorageService(
      { fork: () => ({}) } as unknown as EntityManager,
      { findRequests: async () => [] } as unknown as RequestsService,
      { findQuotas: async () => [] } as unknown as UsersService,
      {
        getSettings: async () => ({
          movieFolders: [path.join(root, 'missing')],
          seriesFolders: [root],
          cleanup: CleanupSchedule.Daily,
          maxDiskUsagePercent,
        }),
      } as unknown as LibraryService,
    );

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'reiverr-storage-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('measures the disks of the folders that are there', async () => {
    const { disks } = await service(null).describe();
    const disk = disks.find((d) => d.path === root);

    expect(disk.totalBytes).toBeGreaterThan(0);
    expect(disk.freeBytes).toBeGreaterThan(0);
    expect(disk.usedPercent).toBeGreaterThanOrEqual(0);
    expect(disk.usedPercent).toBeLessThanOrEqual(100);
    expect(disks.some((d) => d.path === path.join(root, 'missing'))).toBe(
      false,
    );
  });

  it('is full at the limit, and never without one', async () => {
    expect(await service(null).isDiskFull()).toBe(false);
    expect(await service(100).isDiskFull()).toBe(false);
    expect(await service(0).isDiskFull()).toBe(true);
  });
});
