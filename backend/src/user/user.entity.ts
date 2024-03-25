import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

const DEFAULT_SETTINGS = {
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
};

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  password: string;

  @Column()
  isAdmin: boolean = false;

  @Column('json', { default: JSON.stringify(DEFAULT_SETTINGS) })
  settings: {
    autoplayTrailers: boolean;
    language: string;
    animationDuration: number;
    // discover: {
    // 	region: string,
    // 	excludeLibraryItems: true,
    // 	includedLanguages: 'en'
    // },
    sonarr: {
      apiKey: string;
      baseUrl: string;
      qualityProfileId: number;
      rootFolderPath: string;
      languageProfileId: number;
    };
    radarr: {
      apiKey: string;
      baseUrl: string;
      qualityProfileId: number;
      rootFolderPath: string;
    };
    jellyfin: {
      apiKey: string;
      baseUrl: string;
      userId: string;
    };
  } = DEFAULT_SETTINGS;
}
