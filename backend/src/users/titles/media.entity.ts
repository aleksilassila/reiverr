import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Title } from './title.entity';

@Entity()
export class Media {
  @ApiProperty({ required: false })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  seasonNumber?: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  episodeNumber?: number;

  @ApiProperty({ required: false })
  @Column({ default: 0 })
  progress: number;

  @ApiProperty({ required: false })
  @Column({ default: false })
  watched: boolean;

  @ApiProperty({ required: true, type: () => Title })
  @ManyToOne(() => Title, (title) => title.media)
  title: Title;
}
