import { ApiProperty } from '@nestjs/swagger';
import { SourceProviderSettings } from '@aleksilassila/reiverr-plugin';
import { User } from 'src/users/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class MediaSource {
  @ApiProperty({ required: true, type: 'string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true, type: 'string' })
  @Column()
  pluginId: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({ required: true, type: 'string' })
  @PrimaryColumn()
  userId: string;

  @ApiProperty({ required: true, type: 'string' })
  @ManyToOne(() => User, (user) => user.mediaSources)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ required: false, type: 'boolean', default: false })
  @Column({ default: false })
  enabled: boolean = false;

  @ApiProperty({ required: false, type: 'boolean', default: false })
  @Column({ default: false })
  adminControlled: boolean;

  @ApiProperty({ required: false, type: 'object', additionalProperties: true })
  @Column('json', { default: '{}' })
  pluginSettings: SourceProviderSettings = {};

  @ApiProperty()
  @Column({ default: 0 })
  priority: number = 0;
}
