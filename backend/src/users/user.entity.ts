import { ApiProperty } from '@nestjs/swagger';
import { MediaSource } from 'src/media-sources/media-source.entity';
import { LibraryItem } from 'src/user-data/library/library.entity';
import { PlayState } from 'src/user-data/play-state/play-state.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

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

  @ApiProperty({ required: false })
  @Column({ type: 'blob', nullable: true })
  profilePicture: Buffer;

  @Column()
  @ApiProperty({ required: true })
  @Column({ default: false })
  isAdmin: boolean = false;

  @ApiProperty({ required: false })
  @Column({ default: false })
  onboardingDone: boolean = false;

  @ApiProperty({ required: true, type: Settings })
  @Column('json', { default: JSON.stringify(DEFAULT_SETTINGS) })
  settings = DEFAULT_SETTINGS;

  // @ApiProperty({ required: false, type: 'object' })
  // @Column('json', { default: '{}' })
  // pluginSettings: PluginSettings = {};

  @ApiProperty({ required: false, type: MediaSource, isArray: true })
  @OneToMany(() => MediaSource, (mediaSource) => mediaSource.user)
  mediaSources: MediaSource[];

  @ApiProperty({ required: false, type: PlayState, isArray: true })
  @OneToMany(() => PlayState, (playState) => playState.user)
  playStates: PlayState[];

  @ApiProperty({ required: false, type: LibraryItem, isArray: true })
  @OneToMany(() => LibraryItem, (library) => library.user)
  libraryItems: LibraryItem[];
}
