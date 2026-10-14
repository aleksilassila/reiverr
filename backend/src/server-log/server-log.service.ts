import {
  CreateRequestContext,
  EnsureRequestContext,
} from '@mikro-orm/decorators/legacy';
import { EntityManager } from '@mikro-orm/sqlite';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaginatedResponseDto, PaginationDto } from '../common/common.dto.js';
import { SettingsService } from '../settings/settings.service.js';
import { LogEntry, LogType } from './log-entry.entity.js';
import { ServerLogSettingsDto } from './server-log.dto.js';

const SETTINGS_KEY = 'server-log';
const DEFAULT_SETTINGS: ServerLogSettingsDto = {
  maxEntries: 0,
  maxAgeDays: 30,
};
const DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class ServerLogService {
  private readonly logger = new Logger(ServerLogService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly settingsService: SettingsService,
  ) {}

  /** The entries, newest first, of one type or of all */
  async list(
    pagination: PaginationDto,
    type?: LogType,
  ): Promise<PaginatedResponseDto<LogEntry>> {
    const [items, total] = await this.em.findAndCount(
      LogEntry,
      type ? { type } : {},
      {
        orderBy: { createdAt: 'desc' },
        offset: (pagination.page - 1) * pagination.itemsPerPage,
        limit: pagination.itemsPerPage,
        disableIdentityMap: true,
      },
    );

    return {
      items,
      total,
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
    };
  }

  getSettings(): Promise<ServerLogSettingsDto> {
    return this.settingsService.getOrCreateValue(
      SETTINGS_KEY,
      DEFAULT_SETTINGS,
    );
  }

  async updateSettings(
    settings: ServerLogSettingsDto,
  ): Promise<ServerLogSettingsDto> {
    const { maxEntries, maxAgeDays } = settings ?? {};
    const isLimit = (value: unknown) =>
      Number.isInteger(value) && (value as number) >= 0;
    if (!isLimit(maxEntries) || !isLimit(maxAgeDays)) {
      throw new BadRequestException(
        'maxEntries and maxAgeDays must be whole numbers, 0 or greater',
      );
    }

    return this.settingsService.saveValue(SETTINGS_KEY, {
      maxEntries,
      maxAgeDays,
    });
  }

  /** Keeps a record of something the server did, and prints it */
  @EnsureRequestContext()
  async write(
    type: LogType,
    message: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    await this.writeIn(this.em, type, message, data);
  }

  /** Like write, with the entity manager of a transaction of the caller */
  async writeIn(
    em: EntityManager,
    type: LogType,
    message: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log(message);

    const entry = new LogEntry();
    entry.type = type;
    entry.message = message;
    entry.data = data;
    await em.insert(LogEntry, { ...entry });
  }

  /** Deletes the entries that are older or more than the settings keep */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  @CreateRequestContext()
  async purge(): Promise<void> {
    const { maxEntries, maxAgeDays } = await this.getSettings();
    let purged = 0;

    if (maxAgeDays > 0) {
      purged += await this.em.nativeDelete(LogEntry, {
        createdAt: { $lt: new Date(Date.now() - maxAgeDays * DAY) },
      });
    }

    if (maxEntries > 0) {
      const [oldestKept] = await this.em.find(
        LogEntry,
        {},
        {
          fields: ['createdAt'],
          orderBy: { createdAt: 'desc' },
          offset: maxEntries - 1,
          limit: 1,
          disableIdentityMap: true,
        },
      );
      if (oldestKept) {
        purged += await this.em.nativeDelete(LogEntry, {
          createdAt: { $lt: oldestKept.createdAt },
        });
      }
    }

    if (purged) this.logger.log(`Purged ${purged} log entries`);
  }
}
