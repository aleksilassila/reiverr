import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user.entity';
import { Media } from './media.entity';

export enum TitleType {
  movie = 'movie',
  series = 'series',
}

@Entity()
export class Title {
  @ApiProperty({ required: false })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true })
  @Column()
  tmdbId: number;

  @ApiProperty({ required: true, enum: TitleType })
  @Column({ type: 'simple-enum', enum: TitleType, default: TitleType.movie })
  type: TitleType;

  @ApiProperty({ required: false })
  @Column({ default: false })
  upNext: boolean; // TODO: Rename to continueWatching

  @ApiProperty({ required: false })
  @Column({ default: false })
  isInLibrary: boolean = false; // TODO: Remove

  @ApiProperty({ required: false })
  @Column({ default: false })
  watched: boolean = false;

  @ApiProperty({ required: false, type: () => Media, isArray: true })
  @OneToMany(() => Media, (media) => media.title)
  media: Media[];

  @ManyToOne(() => User, (user) => user.titles)
  user: User;
}

// @Entity()
// export class PlayState {
//   @ApiProperty({ required: true })
//   @PrimaryGeneratedColumn('uuid')
//   id: string;
//
//   @ApiProperty({ required: true })
//   @Column()
//   tmdbId: number;
//
//   @ApiProperty({ required: false })
//   @Column({ nullable: true })
//   seasonNumber: number;
//
//   @ApiProperty({ required: false })
//   @Column({ nullable: true })
//   episodeNumber: number;
//
//   @ApiProperty({ required: true })
//   @Column({ type: 'double' })
//   progress: number;
//
//   @ApiProperty({ required: false })
//   @Column({ default: false })
//   watched: boolean;
//
//   @ApiProperty({ required: false })
//   @Column({ default: true })
//   showInUpNext: boolean;
//
//   @ManyToOne(() => User, (user) => user.playStates)
//   user: User;
// }
