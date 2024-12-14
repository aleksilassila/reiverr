import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../user.entity';
import { PlayState } from '../play-state/play-state.entity';

@Entity()
@Unique(['tmdbId', 'userId'])
export class LibraryItem {
  @ApiProperty({ required: false, type: 'string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true, type: 'number' })
  @Column({ unique: true })
  tmdbId: string;

  @ApiProperty({ required: true, type: 'string' })
  @PrimaryColumn()
  userId: string;

  @ApiProperty({ required: false, type: 'string' })
  @ManyToOne(() => User, (user) => user.libraryItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => PlayState, (playState) => playState.libraryItem)
  playStates?: PlayState[];
}
