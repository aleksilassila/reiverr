import { ApiProperty } from '@nestjs/swagger';
import { MovieDto } from 'src/metadata/metadata.dto';
import { PlayStateDto } from '../play-state/play-state.dto';

export class LibraryItemDto {
  @ApiProperty()
  tmdbId: string;

  @ApiProperty({ type: [PlayStateDto], required: false })
  playStates?: PlayStateDto[];

  @ApiProperty({ type: MovieDto, required: false })
  metadata?: MovieDto; // TODO
}
