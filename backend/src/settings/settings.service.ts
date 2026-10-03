import { EnsureRequestContext } from '@mikro-orm/decorators/legacy';
import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import { Settings } from './settings.entity.js';

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
    await this.em.nativeDelete(Settings, { key });
  }

  /**
   * Get all settings
   * @returns All settings
   */
  @EnsureRequestContext()
  async getAllSettings(): Promise<Settings[]> {
    return this.em.findAll(Settings, { disableIdentityMap: true });
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
