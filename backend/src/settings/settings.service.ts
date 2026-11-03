import { EnsureRequestContext } from '@mikro-orm/decorators/legacy';
import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import { assertOutsideTransaction } from '../common/transaction.utils.js';
import { Settings } from './settings.entity.js';

/**
 * The settings are read and saved outside transactions: without a request
 * context, as at boot or in a cron job, EnsureRequestContext gives a method
 * an entity manager of its own, which would wait on the transaction
 */
@Injectable()
export class SettingsService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Retrieve a setting value by key
   * @param key The setting key
   * @returns The setting value or undefined if not found
   */
  @EnsureRequestContext()
  async getValue<TReturn = any>(key: string): Promise<TReturn | undefined> {
    assertOutsideTransaction(`Reading the setting "${key}"`);
    const setting = await this.em.findOne(
      Settings,
      { key },
      { disableIdentityMap: true },
    );
    return setting?.value;
  }

  /**
   * Save or update a setting value for a key
   * @param key The setting key
   * @param value The value to save (will be stored as JSON)
   * @returns The saved setting
   */
  @EnsureRequestContext()
  async saveValue<TReturn = any>(
    key: string,
    value: TReturn,
  ): Promise<TReturn> {
    assertOutsideTransaction(`Saving the setting "${key}"`);
    await this.em
      .createQueryBuilder(Settings)
      .insert({ key, value, updatedAt: new Date() })
      .onConflict('key')
      .merge()
      .execute();
    return await this.getValue<TReturn>(key);
  }

  async getOrCreateValue<TReturn = any>(
    key: string,
    defaultValue: TReturn,
  ): Promise<TReturn> {
    const existingValue = await this.getValue<TReturn>(key);
    if (existingValue === undefined) {
      return this.saveValue<TReturn>(key, defaultValue);
    }

    // Fields that were added to the defaults after the value was stored
    return isPlainObject(defaultValue) && isPlainObject(existingValue)
      ? { ...defaultValue, ...existingValue }
      : existingValue;
  }

  /**
   * Delete a setting by key
   * @param key The setting key to delete
   */
  @EnsureRequestContext()
  async deleteValue(key: string): Promise<void> {
    assertOutsideTransaction(`Deleting the setting "${key}"`);
    await this.em.nativeDelete(Settings, { key });
  }

  /**
   * Get all settings
   * @returns All settings
   */
  @EnsureRequestContext()
  async getAllSettings(): Promise<Settings[]> {
    assertOutsideTransaction('Reading the settings');
    return this.em.findAll(Settings, { disableIdentityMap: true });
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
