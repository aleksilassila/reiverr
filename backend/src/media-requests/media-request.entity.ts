import { ApiProperty } from '@nestjs/swagger';
import { MediaTypeFull } from 'src/common/common.dto';
import { MovieMetadata } from 'src/metadata/metadata.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

// Table already carries the name this module gets once the plugin requests are removed
@Entity('request')
@Unique(['userId', 'tmdbId', 'season', 'episode'])
export class MediaRequest {
  @ApiProperty({ type: 'string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: 'string' })
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ type: 'string' })
  @Column()
  tmdbId: string;

  @ApiProperty({ enum: MediaTypeFull })
  @Column()
  mediaType: MediaTypeFull;

  @ApiProperty({ type: 'number', description: '0 for movies' })
  @Column({ default: 0 })
  season: number = 0;

  @ApiProperty({ type: 'number', description: '0 for movies' })
  @Column({ default: 0 })
  episode: number = 0;

  @ApiProperty({ type: 'boolean' })
  @Column({ default: false })
  approved: boolean = false;

  @ApiProperty({ required: false, type: MovieMetadata })
  @ManyToOne(() => MovieMetadata, {
    createForeignKeyConstraints: false,
    nullable: true,
  })
  @JoinColumn({ name: 'tmdbId', referencedColumnName: 'tmdbId' })
  movieMetadata?: MovieMetadata;

  @ApiProperty({ type: 'string' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ type: 'string' })
  @UpdateDateColumn()
  updatedAt: Date;
}
