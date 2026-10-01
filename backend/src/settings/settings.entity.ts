import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Settings {
  @ApiProperty({ required: true })
  @PrimaryKey()
  key: string;

  @ApiProperty({ required: true })
  @Property({ type: 'json' })
  value: any;

  @ApiProperty({ required: true })
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
