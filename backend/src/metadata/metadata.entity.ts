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

  @ApiProperty({ required: false, type: TmdbMovieFull })
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

  private constructor() {}

  static from(tmdbMovie: TmdbMovieFull) {
    return new MovieMetadata().updateFrom(tmdbMovie);
  }

  updateFrom(tmdbMovie: TmdbMovieFull): MovieMetadata {
    this.tmdbId = String(tmdbMovie.id);
    this.tmdbMovie = tmdbMovie;
    this.updatedAt = new Date();
    this.name = tmdbMovie.title;
    this.releaseDate = tmdbMovie.release_date
      ? new Date(tmdbMovie.release_date)
      : undefined;
    return this;
  }

  needsUpdate() {
    const releaseDate = this.tmdbMovie?.release_date;

    if (!this.tmdbMovie) return true;
    if (!this.updatedAt) return true;
    if (
      releaseDate &&
      new Date() > new Date(releaseDate) &&
      new Date(this.updatedAt) < new Date(releaseDate)
    )
      return true;

    // Is stale

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

  @ApiProperty({ required: false, type: TmdbSeriesFull })
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

  private constructor() {}

  static from(tmdbSeries: TmdbSeriesFull) {
    return new SeriesMetadata().updateFrom(tmdbSeries);
  }

  updateFrom(tmdbSeries: TmdbSeriesFull): SeriesMetadata {
    this.tmdbId = String(tmdbSeries.id);
    this.tmdbSeries = tmdbSeries;
    this.updatedAt = new Date();
    this.firstReleaseDate = tmdbSeries.first_air_date
      ? new Date(tmdbSeries.first_air_date)
      : undefined;
    this.lastReleaseDate = tmdbSeries.last_air_date
      ? new Date(tmdbSeries.last_air_date)
      : undefined;
    this.nextReleaseDate = tmdbSeries.next_episode_to_air?.air_date
      ? new Date(tmdbSeries.next_episode_to_air.air_date)
      : undefined;
    this.lastEpisodeNumber = tmdbSeries.last_episode_to_air?.episode_number;
    this.lastSeasonNumber = tmdbSeries.last_episode_to_air?.season_number;
    this.name = tmdbSeries.name;
    return this;
  }

  needsUpdate() {
    const nextAirDate = this.tmdbSeries?.next_episode_to_air?.air_date;

    // Is missing an episode

    if (!this.tmdbSeries) return true;
    if (!this.updatedAt) return true;
    if (
      nextAirDate &&
      new Date() > new Date(nextAirDate) &&
      new Date(this.updatedAt) < new Date(nextAirDate)
    )
      return true;

    // Is stale

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
