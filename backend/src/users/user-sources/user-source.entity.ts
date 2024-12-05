import { ApiProperty } from '@nestjs/swagger';
import { PluginSettings } from 'plugins/plugin-types';
import { User } from 'src/users/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';


@Entity()
export class MediaSource {
  @ApiProperty({ required: true, type: 'string' })
  @PrimaryColumn()
  id: string;

  @PrimaryColumn()
  userId: string;

  @ApiProperty({ required: true, type: 'string' })
  @ManyToOne(() => User, (user) => user.mediaSources)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ required: false, type: 'string', default: true })
  @Column({ default: true })
  enabled: boolean;

  @ApiProperty({ required: false, type: 'boolean', default: false })
  @Column({ default: false })
  adminControlled: boolean;

  @ApiProperty({ required: false, type: 'object' })
  @Column('json', { default: '{}' })
  pluginSettings: PluginSettings = {};
  // Add other fields as necessary
}
