import { Migration } from '@mikro-orm/migrations';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { copyFile, readdir } from 'node:fs/promises';
import { join, parse, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

type TypeormTables = Map<string, Set<string>>;

const TYPEORM_PREFIX = 'typeorm_';
const NOW = `cast(strftime('%s', 'now') as integer) * 1000`;

// TypeORM stored dates as UTC text, MikroORM stores milliseconds since epoch
const ms = (column: string) =>
  `(cast(strftime('%s', "${column}") as integer) * 1000 + cast(substr(strftime('%f', "${column}"), 4) as integer))`;

const hash = async (file: string) => {
  const sha256 = createHash('sha256');
  await pipeline(createReadStream(file), sha256);
  return sha256.digest('hex');
};

export class Migration20261001175551 extends Migration {
  override name = 'Migration20261001175551';

  override async up(): Promise<void> {
    // Databases created by the TypeORM based releases are converted in place:
    // their tables are moved aside, copied into the new schema and dropped
    const typeormTables = await this.getTypeormTables();

    if (typeormTables.size) await this.backupDatabase();

    for (const table of typeormTables.keys()) {
      this.addSql(
        `alter table "${table}" rename to "${TYPEORM_PREFIX}${table}";`,
      );
    }

    this.addSql(
      `create table \`movie_metadata\` (\`id\` text not null primary key, \`tmdb_id\` text not null, \`tmdb_movie\` json not null, \`name\` text null, \`release_date\` datetime null, \`updated_at\` datetime not null);`,
    );
    this.addSql(
      `create unique index \`movie_metadata_tmdb_id_unique\` on \`movie_metadata\` (\`tmdb_id\`);`,
    );

    this.addSql(
      `create table \`series_metadata\` (\`id\` text not null primary key, \`tmdb_id\` text not null, \`tmdb_series\` json not null, \`name\` text null, \`first_release_date\` datetime null, \`last_release_date\` datetime null, \`next_release_date\` datetime null, \`last_season_number\` integer null, \`last_episode_number\` integer null, \`updated_at\` datetime not null);`,
    );
    this.addSql(
      `create unique index \`series_metadata_tmdb_id_unique\` on \`series_metadata\` (\`tmdb_id\`);`,
    );

    this.addSql(
      `create table \`settings\` (\`key\` text not null primary key, \`value\` json not null, \`updated_at\` datetime not null);`,
    );

    this.addSql(
      `create table \`user\` (\`id\` text not null primary key, \`name\` text not null, \`password\` text not null, \`profile_picture\` blob null, \`is_admin\` integer not null default false, \`onboarding_done\` integer not null default false, \`settings\` json not null);`,
    );
    this.addSql(
      `create unique index \`user_name_unique\` on \`user\` (\`name\`);`,
    );

    this.addSql(
      `create table \`play_state\` (\`id\` text not null primary key, \`tmdb_id\` text not null, \`media_type\` text not null, \`user_id\` text not null, \`season\` integer not null default 0, \`episode\` integer not null default 0, \`watched\` integer not null default false, \`progress\` double not null default 0, \`last_played_at\` datetime not null, constraint \`play_state_user_id_foreign\` foreign key (\`user_id\`) references \`user\` (\`id\`) on delete cascade);`,
    );
    this.addSql(
      `create index \`play_state_user_id_index\` on \`play_state\` (\`user_id\`);`,
    );
    this.addSql(
      `create unique index \`play_state_tmdb_id_user_id_season_episode_unique\` on \`play_state\` (\`tmdb_id\`, \`user_id\`, \`season\`, \`episode\`);`,
    );

    this.addSql(
      `create table \`media_source\` (\`id\` text not null primary key, \`plugin_id\` text not null, \`name\` text not null, \`user_id\` text not null, \`enabled\` integer not null default false, \`admin_controlled\` integer not null default false, \`plugin_settings\` json not null, \`priority\` integer not null default 0, constraint \`media_source_user_id_foreign\` foreign key (\`user_id\`) references \`user\` (\`id\`));`,
    );
    this.addSql(
      `create index \`media_source_user_id_index\` on \`media_source\` (\`user_id\`);`,
    );

    this.addSql(
      `create table \`request\` (\`id\` text not null primary key, \`user_id\` text not null, \`tmdb_id\` text not null, \`media_type\` text not null, \`season\` integer not null default 0, \`episode\` integer not null default 0, \`approved\` integer not null default false, \`created_at\` datetime not null, \`updated_at\` datetime not null, constraint \`request_user_id_foreign\` foreign key (\`user_id\`) references \`user\` (\`id\`) on delete cascade);`,
    );
    this.addSql(
      `create index \`request_user_id_index\` on \`request\` (\`user_id\`);`,
    );
    this.addSql(
      `create unique index \`request_user_id_tmdb_id_season_episode_unique\` on \`request\` (\`user_id\`, \`tmdb_id\`, \`season\`, \`episode\`);`,
    );

    this.addSql(
      `create table \`library_item\` (\`id\` text not null primary key, \`tmdb_id\` text not null, \`media_type\` text not null, \`last_played_at\` datetime null, \`user_id\` text not null, \`updated_at\` datetime not null, \`created_at\` datetime not null, constraint \`library_item_user_id_foreign\` foreign key (\`user_id\`) references \`user\` (\`id\`) on delete cascade);`,
    );
    this.addSql(
      `create index \`library_item_user_id_index\` on \`library_item\` (\`user_id\`);`,
    );
    this.addSql(
      `create unique index \`library_item_tmdb_id_user_id_unique\` on \`library_item\` (\`tmdb_id\`, \`user_id\`);`,
    );

    if (typeormTables.size) {
      this.copyTypeormData(typeormTables);

      for (const table of await this.getDropOrder(typeormTables)) {
        this.addSql(`drop table "${TYPEORM_PREFIX}${table}";`);
      }
    }
  }

  /**
   * Copies the database file next to itself. The statements of this migration
   * only run after `up()` returns, so the file is still the TypeORM database.
   */
  private async backupDatabase() {
    const database = resolve(
      this.config.get('baseDir'),
      this.config.get('dbName'),
    );
    const { dir, name, ext } = parse(database);
    const prefix = `${name}.backup-`;

    // A failed conversion is rolled back and retried on every start
    const previous = (await readdir(dir))
      .filter((file) => file.startsWith(prefix) && file.endsWith(ext))
      .sort()
      .pop();
    if (
      previous &&
      (await hash(join(dir, previous))) === (await hash(database))
    )
      return;

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const backup = join(dir, `${prefix}${timestamp}${ext}`);
    await copyFile(database, backup);

    this.config
      .getLogger()
      .log('migrator', `Backed up the TypeORM database to ${backup}`, {
        enabled: true,
      });
  }

  private async getTypeormTables(): Promise<TypeormTables> {
    const tables = await this.execute(
      `select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name != 'mikro_orm_migrations'`,
    );
    const result: TypeormTables = new Map();

    for (const { name } of tables) {
      const columns = await this.execute(
        `select name from pragma_table_info('${name}')`,
      );
      result.set(name, new Set(columns.map((column) => column.name)));
    }

    return result;
  }

  /** Referenced tables can only be dropped after the tables referencing them */
  private async getDropOrder(tables: TypeormTables): Promise<string[]> {
    const references = new Map<string, Set<string>>();

    for (const table of tables.keys()) {
      const foreignKeys = await this.execute(
        `select "table" from pragma_foreign_key_list('${table}')`,
      );
      references.set(
        table,
        new Set(
          foreignKeys.map((key) => key.table).filter((name) => name !== table),
        ),
      );
    }

    const order: string[] = [];
    const remaining = new Set(tables.keys());

    while (remaining.size) {
      const droppable = [...remaining].filter((table) =>
        [...remaining].every((other) => !references.get(other).has(table)),
      );
      if (!droppable.length) {
        throw new Error('Circular foreign keys between the TypeORM tables');
      }

      for (const table of droppable) {
        order.push(table);
        remaining.delete(table);
      }
    }

    return order;
  }

  private copyTypeormData(tables: TypeormTables) {
    const has = (table: string, ...columns: string[]) =>
      tables.has(table) &&
      columns.every((column) => tables.get(table).has(column));
    const ownedByUser = `where "userId" in (select "id" from "${TYPEORM_PREFIX}user")`;

    const copy = (
      table: string,
      columns: Record<string, string>,
      filter = '',
    ) => {
      const targets = Object.keys(columns)
        .map((column) => `\`${column}\``)
        .join(', ');
      const sources = Object.values(columns).join(', ');

      this.addSql(
        `insert into \`${table}\` (${targets}) select ${sources} from "${TYPEORM_PREFIX}${table}" ${filter} order by rowid;`,
      );
    };

    if (
      !has(
        'user',
        'id',
        'name',
        'password',
        'isAdmin',
        'onboardingDone',
        'settings',
      )
    ) {
      throw new Error(
        'The existing database is not a Reiverr 2 database and cannot be migrated',
      );
    }

    copy('user', {
      id: '"id"',
      name: '"name"',
      password: '"password"',
      profile_picture: has('user', 'profilePicture')
        ? '"profilePicture"'
        : 'null',
      is_admin: '"isAdmin"',
      onboarding_done: '"onboardingDone"',
      settings: '"settings"',
    });

    if (has('media_source')) {
      copy(
        'media_source',
        {
          id: '"id"',
          plugin_id: '"pluginId"',
          name: '"name"',
          user_id: '"userId"',
          enabled: '"enabled"',
          admin_controlled: '"adminControlled"',
          plugin_settings: '"pluginSettings"',
          priority: '"priority"',
        },
        ownedByUser,
      );
    }

    if (has('play_state')) {
      copy(
        'play_state',
        {
          id: '"id"',
          tmdb_id: '"tmdbId"',
          media_type: 'lower("mediaType")',
          user_id: '"userId"',
          season: '"season"',
          episode: '"episode"',
          watched: '"watched"',
          progress: '"progress"',
          last_played_at: ms('lastPlayedAt'),
        },
        ownedByUser,
      );
    }

    if (has('library_item')) {
      const lastPlayedAt = `(select max(${ms('lastPlayedAt')}) from "${TYPEORM_PREFIX}play_state" ps where ps."tmdbId" = "${TYPEORM_PREFIX}library_item"."tmdbId" and ps."userId" = "${TYPEORM_PREFIX}library_item"."userId")`;

      copy(
        'library_item',
        {
          id: '"id"',
          tmdb_id: '"tmdbId"',
          media_type: 'lower("mediaType")',
          last_played_at: has('library_item', 'lastPlayedAt')
            ? ms('lastPlayedAt')
            : lastPlayedAt,
          user_id: '"userId"',
          updated_at: has('library_item', 'updatedAt') ? ms('updatedAt') : NOW,
          created_at: has('library_item', 'createdAt') ? ms('createdAt') : NOW,
        },
        ownedByUser,
      );
    }

    // The metadata tables are a cache, older layouts are left to be refetched
    if (has('movie_metadata', 'name', 'releaseDate')) {
      copy('movie_metadata', {
        id: '"id"',
        tmdb_id: '"tmdbId"',
        tmdb_movie: '"tmdbMovie"',
        name: '"name"',
        release_date: ms('releaseDate'),
        updated_at: ms('updatedAt'),
      });
    }

    if (
      has(
        'series_metadata',
        'name',
        'firstReleaseDate',
        'lastReleaseDate',
        'nextReleaseDate',
        'lastSeasonNumber',
        'lastEpisodeNumber',
      )
    ) {
      copy('series_metadata', {
        id: '"id"',
        tmdb_id: '"tmdbId"',
        tmdb_series: '"tmdbSeries"',
        name: '"name"',
        first_release_date: ms('firstReleaseDate'),
        last_release_date: ms('lastReleaseDate'),
        next_release_date: ms('nextReleaseDate'),
        last_season_number: '"lastSeasonNumber"',
        last_episode_number: '"lastEpisodeNumber"',
        updated_at: ms('updatedAt'),
      });
    }

    if (has('settings', 'key', 'value', 'updatedAt')) {
      copy('settings', {
        key: '"key"',
        value: '"value"',
        updated_at: ms('updatedAt'),
      });
    }

    if (has('request')) {
      copy(
        'request',
        {
          id: '"id"',
          user_id: '"userId"',
          tmdb_id: '"tmdbId"',
          media_type: '"mediaType"',
          season: '"season"',
          episode: '"episode"',
          approved: '"approved"',
          created_at: ms('createdAt'),
          updated_at: ms('updatedAt'),
        },
        ownedByUser,
      );
    }
  }
}
