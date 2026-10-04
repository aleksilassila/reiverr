import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { User } from '../users/user.entity.js';

/**
 * Which of the requests of a user for a series are active, going by what the
 * user has watched. A limit that is null does not apply.
 */
@Entity()
@Unique({ properties: ['userId', 'tmdbId'] })
export class RequestRule {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne(() => User, {
    mapToPk: true,
    fieldName: 'user_id',
    deleteRule: 'cascade',
  })
  userId: string;

  @Property()
  tmdbId: string;

  @ApiProperty({
    type: 'number',
    nullable: true,
    description:
      'How many requests after the last episode the user watched are active',
  })
  @Property({ type: 'integer', nullable: true })
  keepNext: number | null = null;

  @ApiProperty({
    type: 'number',
    nullable: true,
    description:
      'How many of the last watched requests keep their file, while there is more to watch',
  })
  @Property({ type: 'integer', nullable: true })
  keepWatched: number | null = null;

  @ApiProperty({
    type: 'number',
    nullable: true,
    description:
      'For how many hours after it was watched a request keeps its file. With keepWatched, either one keeps it',
  })
  @Property({ type: 'integer', nullable: true })
  keepWatchedHours: number | null = null;
}
