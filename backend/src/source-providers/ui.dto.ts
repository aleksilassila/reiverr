import { type ViewBase } from '@aleksilassila/reiverr-shared';
import { ApiProperty } from '@nestjs/swagger';

enum ViewType {
  GENERAL = 'general',
  LIST_WITH_DETAILS = 'list-with-details',
}

export class ViewBaseDto implements ViewBase {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ViewType, type: 'string' })
  type: 'general' | 'list-with-details';

  @ApiProperty()
  label: string;

  @ApiProperty({ type: 'number', required: false })
  priority?: number;
}
