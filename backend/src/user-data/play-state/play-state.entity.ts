import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { MediaTypeFull } from '../../common/common.dto.js';
import { User } from '../../users/user.entity.js';

@Entity()
@Unique({
  properties: ['userId', 'mediaType', 'tmdbId', 'season', 'episode'],
})
export class PlayState {
  @ApiProperty({ type: 'string' })
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ApiProperty({ required: true, type: 'number' })
  @Property()
  tmdbId: string;

  @ApiProperty({ enum: MediaTypeFull })
  @Property({ type: 'string' })
  mediaType: MediaTypeFull;

  @ApiProperty({ required: true, type: 'string' })
  @ManyToOne(() => User, {
    mapToPk: true,
    fieldName: 'user_id',
    deleteRule: 'cascade',
  })
  userId: string;

  @ApiProperty({ required: false, type: 'number' })
  @Property({ default: 0 })
  season: number = 0;

  @ApiProperty({ required: false, type: 'number' })
  @Property({ default: 0 })
  episode: number = 0;

  @ApiProperty({
    type: 'boolean',
    default: false,
    description: 'Whether the user has watched this media',
  })
  @Property({ default: false })
  watched: boolean = false;

  @ApiProperty({
    default: false,
    example: 0.5,
    description: 'A number between 0 and 1',
  })
  @Property({ type: 'double', default: 0 })
  progress: number = 0;

  @ApiProperty({
    type: 'string',
    description: 'Last time the user played this media',
  })
  @Property({ onUpdate: () => new Date() })
  lastPlayedAt: Date = new Date();
}
