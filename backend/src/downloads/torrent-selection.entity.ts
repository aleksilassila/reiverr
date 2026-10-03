import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { MediaType } from '../common/common.dto.js';
import { User } from '../users/user.entity.js';
import { Torrent } from './torrent.entity.js';

/** The torrent that the requests of a user for a target download from */
@Entity()
@Unique({
  properties: ['userId', 'mediaType', 'tmdbId', 'season', 'episode'],
})
export class TorrentSelection {
  @ApiProperty({ type: 'string' })
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne(() => User, {
    mapToPk: true,
    fieldName: 'user_id',
    deleteRule: 'cascade',
  })
  userId: string;

  @Property({ type: 'string' })
  mediaType: MediaType;

  @Property()
  tmdbId: string;

  @ApiProperty({ type: 'number' })
  @Property({ default: 0 })
  season: number = 0;

  @ApiProperty({ type: 'number', description: '0 for a season pack' })
  @Property({ default: 0 })
  episode: number = 0;

  @ManyToOne(() => Torrent, { mapToPk: true, fieldName: 'torrent_id' })
  torrentId: string;

  @ApiProperty({
    type: 'string',
    description: 'The search result the user picked',
  })
  @Property()
  releaseId: string;

  @Property()
  createdAt: Date = new Date();
}
