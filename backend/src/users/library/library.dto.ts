import { ApiProperty } from '@nestjs/swagger';
import { MovieDto } from 'src/media/media.dto';
import { PlayStateDto } from '../play-state/play-state.dto';

export class LibraryItemDto {
  @ApiProperty()
  tmdbId: string;

  @ApiProperty({ type: [PlayStateDto], required: false })
  playStates?: PlayStateDto[];

  @ApiProperty({ type: MovieDto, required: false })
  metadata?: MovieDto; // TODO
}
