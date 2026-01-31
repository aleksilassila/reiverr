import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Settings } from './settings.entity';
import { SETTINGS_REPOSITORY } from './settings.providers';

@Injectable()
export class SettingsService {
  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: Repository<Settings>,
  ) {}

  /**
   * Retrieve a setting value by key
   * @param key The setting key
   * @returns The setting value or undefined if not found
   */
  async getValue<TReturn = any>(key: string): Promise<TReturn | undefined> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    return setting?.value;
  }

  /**
   * Save or update a setting value for a key
   * @param key The setting key
   * @param value The value to save (will be stored as JSON)
   * @returns The saved setting
   */
  async saveValue<TReturn = any>(
    key: string,
    value: TReturn,
  ): Promise<TReturn> {
    // const setting = this.settingsRepository.create({ key, value });
    // return this.settingsRepository.save(setting).then((s) => s.value);
    await this.settingsRepository.upsert({ key, value: value as any }, ['key']);
    return await this.getValue<TReturn>(key);
  }

  async getOrCreateValue<TReturn = any>(
    key: string,
    defaultValue: TReturn,
  ): Promise<TReturn> {
    const existingValue = await this.getValue<TReturn>(key);
    if (existingValue !== undefined) {
      return existingValue;
    }
    return this.saveValue<TReturn>(key, defaultValue);
  }

  /**
   * Delete a setting by key
   * @param key The setting key to delete
   */
  async deleteValue(key: string): Promise<void> {
    await this.settingsRepository.delete({ key });
  }

  /**
   * Get all settings
   * @returns All settings
   */
  async getAllSettings(): Promise<Settings[]> {
    return this.settingsRepository.find();
  }
}
