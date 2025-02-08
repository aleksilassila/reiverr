import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TmdbMovieFull, TmdbSeriesFull } from './tmdb/tmdb.dto';

@Entity()
export class Movie {
  @ApiProperty({ required: false, type: 'string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true, type: 'string' })
  @Column({ unique: true })
  tmdbId: string;

  @ApiProperty({ required: false, type: 'object' })
  @Column('json')
  tmdbMovie: TmdbMovieFull;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity()
export class Series {
  @ApiProperty({ required: false, type: 'string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true, type: 'string' })
  @Column({ unique: true })
  tmdbId: string;

  @ApiProperty({ required: false, type: 'object' })
  @Column('json')
  tmdbSeries: TmdbSeriesFull;

  @UpdateDateColumn()
  updatedAt: Date;
}
