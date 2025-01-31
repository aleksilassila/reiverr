import { ApiProperty } from '@nestjs/swagger';
import { MovieDto } from 'src/metadata/metadata.dto';
import { PlayStateDto } from '../play-state/play-state.dto';
import { MediaType } from 'src/common/common.dto';

export class LibraryItemDto {
  @ApiProperty()
  tmdbId: string;

  @ApiProperty({ enum: MediaType })
  mediaType: MediaType;

  @ApiProperty({ type: [PlayStateDto], required: false })
  playStates?: PlayStateDto[];

  @ApiProperty({ type: MovieDto, required: false })
  metadata?: MovieDto; // TODO
}
