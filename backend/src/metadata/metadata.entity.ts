import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TmdbMovieFull } from './tmdb/tmdb.dto';

@Entity()
export class Movie {
  @ApiProperty({ required: false, type: 'string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true, type: 'string' })
  @Column({ unique: true })
  tmdbId: string;

  @Column('json')
  tmdbMovie: TmdbMovieFull;

  @UpdateDateColumn()
  updatedAt: Date;
}
