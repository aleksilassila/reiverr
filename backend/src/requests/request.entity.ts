import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { MediaTypeFull } from '../common/common.dto.js';
import { User } from '../users/user.entity.js';

/**
 * A user's wish for a movie or an episode on disk. The row says what the
 * user wants and which gates it passed; how it is fulfilled is the
 * library's business.
 */
@Entity({ tableName: 'request' })
@Unique({
  properties: ['userId', 'mediaType', 'tmdbId', 'season', 'episode'],
})
export class MediaRequest {
  @ApiProperty({ type: 'string' })
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ApiProperty({ type: 'string' })
  @ManyToOne(() => User, {
    mapToPk: true,
    fieldName: 'user_id',
    deleteRule: 'cascade',
  })
  userId: string;

  @ApiProperty({ type: 'string' })
  @Property()
  tmdbId: string;

  @ApiProperty({ enum: MediaTypeFull })
  @Property({ type: 'string' })
  mediaType: MediaTypeFull;

  @ApiProperty({ type: 'number', description: '0 for movies' })
  @Property({ default: 0 })
  season: number = 0;

  @ApiProperty({ type: 'number', description: '0 for movies' })
  @Property({ default: 0 })
  episode: number = 0;

  /** The admin's gate. Once approved, a request stays approved. */
  @ApiProperty({ type: 'boolean' })
  @Property({ default: false })
  approved: boolean = false;

  /**
   * When the request passed the download-ahead gate of the rule of its user
   * with a source. Set once by the rules, never cleared.
   */
  @ApiProperty({ required: false, type: 'string', format: 'date-time' })
  @Property({ nullable: true })
  neededSince?: Date;

  /**
   * When the episode was watched, as the play state of the user has it. What
   * the keep settings of the rule go by.
   */
  @ApiProperty({ required: false, type: 'string', format: 'date-time' })
  @Property({ nullable: true })
  watchedAt?: Date;

  @ApiProperty({ type: 'string' })
  @Property()
  createdAt: Date = new Date();

  @ApiProperty({ type: 'string' })
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
