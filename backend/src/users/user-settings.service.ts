import { Injectable } from '@nestjs/common';
import { SettingsService } from 'src/settings/settings.service';

export class SonarrSettings {
  apiKey: string;
  baseUrl: string;
  qualityProfileId: number;
  rootFolderPath: string;
  languageProfileId: number;
}

export class RadarrSettings {
  apiKey: string;
  baseUrl: string;
  qualityProfileId: number;
  rootFolderPath: string;
}

export class JellyfinSettings {
  apiKey: string;
  baseUrl: string;
  userId: string;
}

export class TmdbSettings {
  sessionId: string;
  userId: string;
}

export class UserSettings {
  autoplayTrailers: boolean;
  language: string;
  animationDuration: number;
  sonarr: SonarrSettings;
  radarr: RadarrSettings;
  jellyfin: JellyfinSettings;
  tmdb: TmdbSettings;
}

const DEFAULT_USER_SETTINGS: UserSettings = {
  autoplayTrailers: true,
  language: 'en',
  animationDuration: 300,
  sonarr: {
    apiKey: '',
    baseUrl: '',
    qualityProfileId: 0,
    rootFolderPath: '',
    languageProfileId: 0,
  },
  radarr: {
    apiKey: '',
    baseUrl: '',
    qualityProfileId: 0,
    rootFolderPath: '',
  },
  jellyfin: {
    apiKey: '',
    baseUrl: '',
    userId: '',
  },
  tmdb: {
    sessionId: '',
    userId: '',
  },
};

@Injectable()
export class UserSettingsService {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Generate the settings key for a user
   * @param userId The user ID
   * @returns The settings key
   */
  private getUserSettingsKey(userId: string): string {
    return `user.${userId}`;
  }

  /**
   * Get user settings for a specific user
   * @param userId The user ID
   * @returns The user settings or default settings if not found
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    const key = this.getUserSettingsKey(userId);
    const settings = await this.settingsService.getValue(key);
    return settings || DEFAULT_USER_SETTINGS;
  }

  /**
   * Save user settings for a specific user
   * @param userId The user ID
   * @param settings The settings to save
   * @returns The saved settings
   */
  async saveUserSettings(
    userId: string,
    settings: UserSettings,
  ): Promise<UserSettings> {
    const key = this.getUserSettingsKey(userId);
    await this.settingsService.saveValue(key, settings);
    return settings;
  }

  /**
   * Update partial user settings for a specific user
   * @param userId The user ID
   * @param partialSettings Partial settings to update
   * @returns The updated settings
   */
  async updateUserSettings(
    userId: string,
    partialSettings: Partial<UserSettings>,
  ): Promise<UserSettings> {
    const currentSettings = await this.getUserSettings(userId);
    const updatedSettings = { ...currentSettings, ...partialSettings };
    return this.saveUserSettings(userId, updatedSettings);
  }

  /**
   * Delete user settings for a specific user
   * @param userId The user ID
   */
  async deleteUserSettings(userId: string): Promise<void> {
    const key = this.getUserSettingsKey(userId);
    await this.settingsService.deleteValue(key);
  }

  /**
   * Reset user settings to defaults
   * @param userId The user ID
   * @returns The default settings
   */
  async resetUserSettings(userId: string): Promise<UserSettings> {
    return this.saveUserSettings(userId, DEFAULT_USER_SETTINGS);
  }
}
