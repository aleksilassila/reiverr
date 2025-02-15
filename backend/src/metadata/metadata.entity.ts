import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TmdbMovieFull, TmdbSeriesFull } from './tmdb/tmdb.dto';
import { TMDB_CACHE_TTL } from 'src/consts';

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

  @ApiProperty({ type: 'string' })
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

  @ApiProperty({ type: 'string' })
  @UpdateDateColumn()
  updatedAt: Date;

  isStale() {
    console.log(this.updatedAt);
    if (!this.updatedAt) return true;

    console.log(
      new Date().getTime() - this.updatedAt.getTime(),
      TMDB_CACHE_TTL,
    );
    if (new Date().getTime() - this.updatedAt.getTime() > TMDB_CACHE_TTL)
      return true;

    console.log(
      'Checking if series is stale',
      this.tmdbSeries.name,
      this.tmdbSeries.next_episode_to_air?.air_date,
    );
    if (
      this.tmdbSeries?.next_episode_to_air?.air_date &&
      new Date() > new Date(this.tmdbSeries.next_episode_to_air.air_date)
    ) {
      return true;
    }

    return false;
  }
}
