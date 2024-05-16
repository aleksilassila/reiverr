import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

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

export class JellyfinSettings {
  @ApiProperty({ required: true })
  apiKey: string;
  @ApiProperty({ required: true })
  baseUrl: string;
  @ApiProperty({ required: true })
  userId: string;
}

export class TmdbSettings {
  @ApiProperty({ required: true })
  sessionId: string;

  @ApiProperty({ required: true })
  userId: string;
}

export class Settings {
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

const DEFAULT_SETTINGS: Settings = {
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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ required: true })
  @Column()
  password: string;

  @ApiProperty({ required: true })
  @Column()
  isAdmin: boolean = false;

  @ApiProperty({ required: true, type: Settings })
  @Column('json', { default: JSON.stringify(DEFAULT_SETTINGS) })
  settings = DEFAULT_SETTINGS;
}
