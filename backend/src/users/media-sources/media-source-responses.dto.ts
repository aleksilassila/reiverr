import { ApiProperty } from '@nestjs/swagger';
import { StreamBaseDto } from '../../source-providers/source-provider.dto.js';

export class AutoplayResponseDto {
  @ApiProperty({ type: StreamBaseDto, required: false })
  candidate?: StreamBaseDto;
}
