import { ApiProperty } from '@nestjs/swagger';
import { StreamBaseDto } from 'src/source-providers/source-provider.dto';

export class AutoplayResponseDto {
  @ApiProperty({ type: StreamBaseDto, required: false })
  candidate?: StreamBaseDto;
}
