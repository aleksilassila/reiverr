import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import type { SourceProviderSettings } from '@aleksilassila/reiverr-shared/dist/src/old.js';
import { randomUUID } from 'node:crypto';
import { User } from '../user.entity.js';

@Entity()
export class MediaSource {
  @ApiProperty({ required: true, type: 'string' })
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** TODO: Rename to providerId */
  @ApiProperty({ required: true, type: 'string' })
  @Property()
  pluginId: string;

  @ApiProperty()
  @Property()
  name: string;

  @ApiProperty({ required: true, type: 'string' })
  @ManyToOne(() => User, { mapToPk: true, fieldName: 'user_id' })
  userId: string;

  @ApiProperty({ required: false, type: 'boolean', default: false })
  @Property({ default: false })
  enabled: boolean = false;

  @ApiProperty({ required: false, type: 'boolean', default: false })
  @Property({ default: false })
  adminControlled: boolean;

  @ApiProperty({
    selfRequired: false,
    type: 'object',
    additionalProperties: true,
  })
  @Property({ type: 'json' })
  pluginSettings: SourceProviderSettings = {};

  @ApiProperty()
  @Property({ default: 0 })
  priority: number = 0;
}
