import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user.entity';

@Entity()
export class PlayState {
  @ApiProperty({ required: true })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true })
  @Column()
  tmdbId: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  seasonNumber: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  episodeNumber: number;

  @ApiProperty({ required: true })
  @Column({ type: 'double' })
  progress: number;

  @ApiProperty({ required: false })
  @Column({ default: false })
  watched: boolean;

  @ApiProperty({ required: false })
  @Column({ default: true })
  showInUpNext: boolean;

  @ManyToOne(() => User, (user) => user.playStates)
  user: User;
}
