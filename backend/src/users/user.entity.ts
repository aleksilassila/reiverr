import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';

/** @deprecated Use UserSettings from user-settings.service.ts instead */
export class SonarrSettings {
  @ApiProperty({ required: true })
  apiKey: string;
  @ApiProperty({ required: true })
  baseUrl: string;
  @ApiProperty({ required: true })
  qualityProfileId: number;
  @ApiProperty({ required: true })
  rootFolderPath: string;
  @ApiProperty({ required: true })
  languageProfileId: number;
}

/** @deprecated Use UserSettings from user-settings.service.ts instead */
export class RadarrSettings {
  @ApiProperty({ required: true })
  apiKey: string;
  @ApiProperty({ required: true })
  baseUrl: string;
  @ApiProperty({ required: true })
  qualityProfileId: number;
  @ApiProperty({ required: true })
  rootFolderPath: string;
}

/** @deprecated Use UserSettings from user-settings.service.ts instead */
export class JellyfinSettings {
  @ApiProperty({ required: true })
  apiKey: string;
  @ApiProperty({ required: true })
  baseUrl: string;
  @ApiProperty({ required: true })
  userId: string;
}

/** @deprecated Use UserSettings from user-settings.service.ts instead */
export class TmdbSettings {
  @ApiProperty({ required: true })
  sessionId: string;

  @ApiProperty({ required: true })
  userId: string;
}

/** @deprecated Use UserSettings from user-settings.service.ts instead */
export class UserSettingsDto {
  @ApiProperty({ required: true })
  autoplayTrailers: boolean;
  @ApiProperty({ required: true })
  language: string;
  @ApiProperty({ required: true })
  animationDuration: number;
  // discover: {
  // 	region: string,
  // 	excludeLibraryItems: true,
  // 	includedLanguages: 'en'
  // },
  @ApiProperty({ required: true, type: SonarrSettings })
  sonarr: SonarrSettings;
  @ApiProperty({ required: true, type: RadarrSettings })
  radarr: RadarrSettings;
  @ApiProperty({ required: true, type: JellyfinSettings })
  jellyfin: JellyfinSettings;
  @ApiProperty({ required: true, type: TmdbSettings })
  tmdb: TmdbSettings;
}

/** @deprecated Use DEFAULT_USER_SETTINGS from user-settings.service.ts instead */
const DEFAULT_SETTINGS: UserSettingsDto = {
  autoplayTrailers: true,
  language: 'en',
  animationDuration: 300,
  // discover: {
  // 	region: 'US',
  // 	excludeLibraryItems: true,
  // 	includedLanguages: 'en'
  // },
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

@Entity()
export class User {
  @ApiProperty({ required: true })
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ApiProperty({ required: true })
  @Property({ unique: true })
  name: string;

  @ApiProperty({ required: true })
  @Property()
  password: string;

  @ApiProperty({ required: false })
  @Property({ type: 'blob', nullable: true })
  profilePicture: Buffer;

  @ApiProperty({ required: true })
  @Property({ default: false })
  isAdmin: boolean = false;

  @ApiProperty({ required: false })
  @Property({ default: false })
  onboardingDone: boolean = false;

  /** @deprecated Use UserSettingsService to manage user settings instead */
  @ApiProperty({ required: true, type: UserSettingsDto })
  @Property({ type: 'json' })
  settings: UserSettingsDto = structuredClone(DEFAULT_SETTINGS);
}
