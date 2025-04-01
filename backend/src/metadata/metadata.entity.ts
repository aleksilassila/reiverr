import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  TmdbEpisodeFull,
  TmdbMovieFull,
  TmdbSeriesFull,
} from './tmdb/tmdb.dto';
import { TMDB_CACHE_TTL } from 'src/consts';
import { LibraryItem } from 'src/user-data/library/library.entity';

@Entity()
export class MovieMetadata {
  @ApiProperty({ required: false, type: 'string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true, type: 'string' })
  @Column({ unique: true })
  tmdbId: string;

  //

  @ApiProperty({ required: false, type: 'object' })
  @Column('json')
  tmdbMovie: TmdbMovieFull;

  @ApiProperty({ required: false, type: 'string' })
  @Column({ nullable: true })
  name?: string;

  @ApiProperty({ required: false, type: 'string' })
  @Column({ nullable: true })
  releaseDate?: Date;

  //

  @ApiProperty({ type: [LibraryItem], required: false })
  @OneToMany(() => LibraryItem, (libraryItem) => libraryItem.seriesMetadata)
  libraryItems?: LibraryItem[];

  @ApiProperty({ type: 'string' })
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Requires update before serving
   */
  isOutdated() {
    const releaseDate = this.tmdbMovie?.release_date;

    if (!this.tmdbMovie) return true;
    if (!this.updatedAt) return true;
    if (
      releaseDate &&
      new Date() > new Date(releaseDate) &&
      new Date(this.updatedAt) < new Date(releaseDate)
    )
      return true;

    return false;
  }

  /**
   * Can be lazily updated after serving
   */
  isStale() {
    if (this.isOutdated()) return true;

    if (new Date().getTime() - this.updatedAt.getTime() > TMDB_CACHE_TTL)
      return true;

    return false;
  }
}

@Entity()
export class SeriesMetadata {
  @ApiProperty({ required: false, type: 'string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true, type: 'string' })
  @Column({ unique: true })
  tmdbId: string;

  //

  @ApiProperty({ required: false, type: 'object' })
  @Column('json')
  tmdbSeries: TmdbSeriesFull;

  @ApiProperty({ required: false, type: 'string' })
  @Column({ nullable: true })
  name?: string;

  @ApiProperty({ required: false, type: 'string' })
  @Column({ nullable: true })
  firstReleaseDate?: Date;

  @ApiProperty({ required: false, type: 'string' })
  @Column({ nullable: true })
  lastReleaseDate?: Date;

  @ApiProperty({ required: false, type: 'string' })
  @Column({ nullable: true })
  nextReleaseDate?: Date;

  @ApiProperty({ required: false, type: 'number' })
  @Column({ nullable: true })
  lastSeasonNumber?: number;

  @ApiProperty({ required: false, type: 'number' })
  @Column({ nullable: true })
  lastEpisodeNumber?: number;

  //

  @ApiProperty({ type: [LibraryItem], required: false })
  @OneToMany(() => LibraryItem, (libraryItem) => libraryItem.seriesMetadata)
  libraryItems?: LibraryItem[];

  @ApiProperty({ type: 'string' })
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Requires update before serving
   */
  isOutdated() {
    const nextAirDate = this.tmdbSeries?.next_episode_to_air?.air_date;

    if (!this.tmdbSeries) return true;
    if (!this.updatedAt) return true;
    if (
      nextAirDate &&
      new Date() > new Date(nextAirDate) &&
      new Date(this.updatedAt) < new Date(nextAirDate)
    )
      return true;

    return false;
  }

  /**
   * Can be lazily updated after serving
   */
  isStale() {
    if (this.isOutdated()) return true;

    if (new Date().getTime() - this.updatedAt.getTime() > TMDB_CACHE_TTL)
      return true;

    return false;
  }
}

/**
 * TODO
 */
export class EpisodeMetadata {
  @ApiProperty({ required: false, type: 'string' })
  tmdbEpisode: TmdbEpisodeFull;
}
