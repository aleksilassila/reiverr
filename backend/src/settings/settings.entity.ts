import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Settings {
  @ApiProperty({ required: true })
  @PrimaryColumn()
  key: string;

  @ApiProperty({ required: true })
  @Column('json')
  value: any;

  @ApiProperty({ required: true })
  @UpdateDateColumn()
  updatedAt: Date;
}
