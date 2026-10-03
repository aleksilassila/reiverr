import { MikroORM } from '@mikro-orm/sqlite';
import mikroOrmConfig from '../mikro-orm.config.js';
import { SettingsService } from './settings.service.js';

describe('SettingsService', () => {
  let orm: MikroORM;
  let settings: SettingsService;

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();
    settings = new SettingsService(orm.em);
  });

  afterEach(() => orm.close());

  it('stores the default value when nothing is stored', async () => {
    const defaults = { seedRatio: 0 };

    expect(await settings.getOrCreateValue('downloads', defaults)).toEqual(
      defaults,
    );
    expect(await settings.getValue('downloads')).toEqual(defaults);
  });

  it('fills fields that are missing from a stored object with the defaults', async () => {
    await settings.saveValue('downloads', { seedRatio: 2 });

    expect(
      await settings.getOrCreateValue('downloads', {
        seedRatio: 0,
        maxDiskUsage: 0.9,
      }),
    ).toEqual({ seedRatio: 2, maxDiskUsage: 0.9 });
  });

  it('returns stored lists as they are', async () => {
    await settings.saveValue('indexers', [{ id: '1' }]);

    expect(await settings.getOrCreateValue('indexers', [])).toEqual([
      { id: '1' },
    ]);
  });
});
