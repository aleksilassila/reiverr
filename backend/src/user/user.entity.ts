import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CsnInstance, CsnPeer } from '../csn/csn.entity';

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
    apiKey: '9dc754ad59244fcdb9be171efd49bd23',
    baseUrl: 'http://192.168.0.129:8989',
    qualityProfileId: 4,
    rootFolderPath: '',
    languageProfileId: 1,
  },
  radarr: {
    apiKey: 'b3d4dedb30f847a0a7ddcf47c9692b37',
    baseUrl: 'http://192.168.0.129:7878',
    qualityProfileId: 0,
    rootFolderPath: '',
  },
  jellyfin: {
    apiKey: 'ff526980723144a095f560fc2975657b',
    baseUrl: 'http://192.168.0.129:8096',
    userId: '75dcb061c9404115a7acdc893ea6bbbc',
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

  @OneToOne(() => CsnInstance, (instance) => instance.user)
  instance: Relation<CsnInstance>;
}
