import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';

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

  /** `hashPassword` of password.utils.ts */
  @Property({ hidden: true })
  passwordHash: string;

  @ApiProperty({ required: false })
  @Property({ type: 'blob', nullable: true })
  profilePicture: Buffer;

  @ApiProperty({ required: true })
  @Property({ default: false })
  isAdmin: boolean = false;

  @ApiProperty({ required: false })
  @Property({ default: false })
  onboardingDone: boolean = false;

  /**
   * The most that the files the requests of the user hold, and the
   * downloads they wait for, may take. Set by admins; null is no quota.
   */
  @ApiProperty({
    type: 'number',
    nullable: true,
    description: 'Bytes; null for no quota',
  })
  @Property({ type: 'integer', nullable: true })
  quotaBytes: number | null = null;

  /** @deprecated Use UserSettingsService to manage user settings instead */
  @ApiProperty({ required: true, type: UserSettingsDto })
  @Property({ type: 'json' })
  settings: UserSettingsDto = structuredClone(DEFAULT_SETTINGS);
}
