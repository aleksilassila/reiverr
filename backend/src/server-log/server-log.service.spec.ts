import { MikroORM } from '@mikro-orm/sqlite';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import mikroOrmConfig from '../mikro-orm.config.js';
import { SettingsService } from '../settings/settings.service.js';
import { LogEntry, LogType } from './log-entry.entity.js';
import { ServerLogService } from './server-log.service.js';

const DAY = 24 * 60 * 60 * 1000;

describe('ServerLogService', () => {
  let orm: MikroORM;
  let serverLog: ServerLogService;

  /** Adds an entry that was written the given number of days ago */
  const addEntry = (daysAgo: number) =>
    orm.em.fork().insert(LogEntry, {
      id: randomUUID(),
      type: LogType.FileDeleted,
      message: `${daysAgo} days ago`,
      createdAt: new Date(Date.now() - daysAgo * DAY),
    });

  const messages = async () =>
    (await orm.em.fork().find(LogEntry, {}, { orderBy: { createdAt: 'asc' } }))
      .map((entry) => entry.message)
      .join(', ');

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();
    serverLog = new ServerLogService(orm.em, new SettingsService(orm.em));

    for (const daysAgo of [40, 31, 29, 2, 1]) await addEntry(daysAgo);
  });

  afterEach(() => orm.close());

  it('writes an entry', async () => {
    await serverLog.write(LogType.FileDeleted, 'Deleted a file', { size: 5 });

    expect(
      await orm.em.fork().findOne(LogEntry, { message: 'Deleted a file' }),
    ).toMatchObject({ type: 'file.deleted', data: { size: 5 } });
  });

  it('purges the entries that are older than 30 days unless set otherwise', async () => {
    expect(await serverLog.getSettings()).toEqual({
      maxEntries: 0,
      maxAgeDays: 30,
    });

    await serverLog.purge();

    expect(await messages()).toBe('29 days ago, 2 days ago, 1 days ago');
  });

  it('purges all but the newest entries when their number is limited', async () => {
    await serverLog.updateSettings({ maxEntries: 2, maxAgeDays: 0 });
    await serverLog.purge();
    expect(await messages()).toBe('2 days ago, 1 days ago');

    // Fewer entries than the limit are all kept
    await serverLog.updateSettings({ maxEntries: 5, maxAgeDays: 0 });
    await serverLog.purge();
    expect(await messages()).toBe('2 days ago, 1 days ago');
  });

  it('purges by both limits', async () => {
    await serverLog.updateSettings({ maxEntries: 4, maxAgeDays: 2 });
    await serverLog.purge();

    expect(await messages()).toBe('1 days ago');
  });

  it('purges nothing with both limits off', async () => {
    await serverLog.updateSettings({ maxEntries: 0, maxAgeDays: 0 });
    await serverLog.purge();

    expect(await messages()).toBe(
      '40 days ago, 31 days ago, 29 days ago, 2 days ago, 1 days ago',
    );
  });

  it('rejects limits that are not whole numbers from 0', async () => {
    for (const settings of [
      { maxEntries: -1, maxAgeDays: 30 },
      { maxEntries: 0, maxAgeDays: 1.5 },
      { maxEntries: 0 },
    ]) {
      await expect(serverLog.updateSettings(settings as never)).rejects.toThrow(
        BadRequestException,
      );
    }
  });
});
