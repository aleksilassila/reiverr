import { ApiProperty } from '@nestjs/swagger';
import { MovieDto } from 'src/media/media.dto';

export class LibraryItemDto {
  @ApiProperty()
  tmdbId: string;

  @ApiProperty({ type: MovieDto, required: false })
  metadata?: MovieDto; // TODO
}
