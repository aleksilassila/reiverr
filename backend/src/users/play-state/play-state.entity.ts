import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user.entity';
import { LibraryItem } from '../library/library.entity';
import { UserDto } from '../user.dto';
import { MediaType } from 'src/common/common.dto';

@Entity()
@Unique(['tmdbId', 'userId', 'season', 'episode'])
export class PlayState {
  @ApiProperty({ required: false, type: 'string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true, type: 'number' })
  @Column({ unique: true })
  tmdbId: string;

  @ApiProperty({ required: false, enum: MediaType })
  @Column({ nullable: true })
  mediaType: MediaType;

  @ApiProperty({ required: true, type: 'string' })
  @Column()
  userId: string;

  // @ApiProperty({ required: false, type: UserDto })
  @ManyToOne(() => User, (user) => user.playStates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ApiProperty({ required: false, type: 'number' })
  @PrimaryColumn({ default: 0 })
  season: number = 0;

  @ApiProperty({ required: false, type: 'number' })
  @PrimaryColumn({ default: 0 })
  episode: number = 0;

  @ApiProperty({
    required: false,
    type: 'boolean',
    default: false,
    description: 'Whether the user has watched this media',
  })
  @Column({ default: false })
  watched: boolean = false;

  @ApiProperty({
    required: false,
    default: false,
    example: 0.5,
    description: 'A number between 0 and 1',
  })
  @Column('double', { default: 0 })
  progress: number = 0;

  @ApiProperty({
    type: 'string',
    description: 'Last time the user played this media',
    required: false,
  })
  @UpdateDateColumn()
  lastPlayedAt: Date;

  @ManyToOne(() => LibraryItem, (libraryItem) => libraryItem.playStates, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn([
    { name: 'tmdbId', referencedColumnName: 'tmdbId' },
    { name: 'userId', referencedColumnName: 'userId' },
  ])
  libraryItem?: LibraryItem;
}
