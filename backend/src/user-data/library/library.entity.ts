import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from 'src/common/common.dto';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { PlayState } from '../play-state/play-state.entity';
import { PlayStateDto } from '../play-state/play-state.dto';

@Entity()
@Unique(['tmdbId', 'userId'])
export class LibraryItem {
  @ApiProperty({ required: false, type: 'string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true })
  @Column({ unique: true })
  tmdbId: string;

  @ApiProperty({ required: true, enum: MediaType })
  @Column()
  mediaType: MediaType;

  @ApiProperty({ required: true, type: 'string' })
  @PrimaryColumn()
  userId: string;

  @ApiProperty({ required: false, type: 'string' })
  @ManyToOne(() => User, (user) => user.libraryItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ type: [PlayStateDto], required: false })
  @OneToMany(() => PlayState, (playState) => playState.libraryItem)
  playStates?: PlayState[];

  /** @deprecated */
  @ApiProperty({ type: 'string' })
  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ApiProperty({ type: 'string' })
  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
