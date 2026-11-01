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

/**
 * What a user has with a title: whether it is on their list, when they
 * last played it, and what they would watch next. The row exists once the
 * user lists the title or plays something of it.
 */
@Entity({ tableName: 'title_state' })
@Unique({ properties: ['userId', 'mediaType', 'tmdbId'] })
export class TitleState {
  @ApiProperty({ required: false, type: 'string' })
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ApiProperty({ required: true })
  @Property()
  tmdbId: string;

  @ApiProperty({ required: true, enum: MediaType })
  @Property({ type: 'string' })
  mediaType: MediaType;

  @ApiProperty({ required: true, type: 'string' })
  @ManyToOne(() => User, {
    mapToPk: true,
    fieldName: 'user_id',
    deleteRule: 'cascade',
  })
  userId: string;

  @ApiProperty({ type: 'string', required: false })
  @Property({ nullable: true })
  addedToMyListAt?: Date;

  @ApiProperty({ type: 'string', required: false })
  @Property({ nullable: true })
  lastPlayedAt?: Date;

  /**
   * The next episode to watch: the first unwatched one after the episode
   * watched last, in the watch order of the series, or the movie itself
   * (season 0, episode 0) while it is not watched; null when nothing is
   * left. Stamped where the watched flag of a play state changes, when the
   * title is listed, and over every row at boot and once a night.
   */
  @ApiProperty({ type: 'number', required: false })
  @Property({ nullable: true })
  nextSeason?: number;

  @ApiProperty({ type: 'number', required: false })
  @Property({ nullable: true })
  nextEpisode?: number;

  /** When the next episode airs or aired; null when it has no date, which is not yet */
  @ApiProperty({ type: 'string', required: false })
  @Property({ nullable: true })
  nextAirDate?: Date;

  @ApiProperty({ type: 'string' })
  @Property()
  createdAt: Date = new Date();
}
