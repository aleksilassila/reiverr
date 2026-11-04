import { EntityManager } from '@mikro-orm/sqlite';
import { AppService } from './app.service.js';
import { DownloadsService } from './downloads/downloads.service.js';
import { JobsService } from './jobs/jobs.service.js';
import { DeletionService } from './library/deletion.service.js';
import { ScanService } from './library/scan.service.js';
import { RequestsService } from './requests/requests.service.js';
import { ServerLogService } from './server-log/server-log.service.js';
import { TitleStateService } from './user-data/title-state.service.js';

describe('AppService', () => {
  /** The service with every step noted, and the steps of `fails` rejecting */
  const service = (
    calls: string[],
    {
      stampAll,
      fails = [],
    }: { stampAll?: () => Promise<void>; fails?: string[] } = {},
  ) => {
    const step = (name: string) => async () => {
      calls.push(name);
      if (fails.includes(name)) throw new Error(`${name} failed`);
    };

    return new AppService(
      { fork: () => ({}) } as unknown as EntityManager,
      {
        enqueue: step('sweep'),
        purge: step('purge jobs'),
      } as unknown as JobsService,
      { stampAll: stampAll ?? step('stamps') } as unknown as TitleStateService,
      {
        reconcileAllRequests: step('requests'),
      } as unknown as RequestsService,
      { onCleanupHour: step('cleanup') } as unknown as DeletionService,
      { scanNightly: step('scans') } as unknown as ScanService,
      { purge: step('purge server log') } as unknown as ServerLogService,
      {
        enqueueEveryTorrent: step('torrents'),
        purgeTorrents: step('purge torrents'),
      } as unknown as DownloadsService,
    );
  };

  it('brings the requests in line at boot before the jobs that go by them', async () => {
    const calls: string[] = [];

    await service(calls).onApplicationBootstrap();

    expect(calls).toEqual(['requests', 'sweep', 'torrents', 'stamps']);
  });

  it('boots without waiting for the stamps, and when they fail', async () => {
    await expect(
      service([], {
        stampAll: () => Promise.reject(new Error('no')),
      }).onApplicationBootstrap(),
    ).resolves.toBeUndefined();
    await expect(
      service([], {
        stampAll: () => new Promise(() => {}),
      }).onApplicationBootstrap(),
    ).resolves.toBeUndefined();
  });

  it('runs the steps of the night in order', async () => {
    const calls: string[] = [];

    await service(calls).preNightly();
    expect(calls).toEqual(['requests', 'sweep']);

    calls.length = 0;
    await service(calls).nightly();
    expect(calls).toEqual([
      'cleanup',
      'scans',
      'purge jobs',
      'purge server log',
      'purge torrents',
      'stamps',
    ]);
  });

  it('goes on after a step of the night that fails', async () => {
    const calls: string[] = [];

    await expect(
      service(calls, { fails: ['requests'] }).preNightly(),
    ).resolves.toBeUndefined();
    expect(calls).toEqual(['requests', 'sweep']);

    calls.length = 0;
    await expect(
      service(calls, { fails: ['cleanup', 'purge jobs'] }).nightly(),
    ).resolves.toBeUndefined();
    expect(calls).toHaveLength(6);
  });
});
