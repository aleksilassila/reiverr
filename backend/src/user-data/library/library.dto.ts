import { ApiProperty, PickType } from '@nestjs/swagger';
import { MovieDto } from 'src/metadata/metadata.dto';
import { Series } from 'src/metadata/metadata.entity';
import { LibraryItem } from './library.entity';

export class LibraryItemDto extends PickType(LibraryItem, [
  'tmdbId',
  'mediaType',
  'playStates',
  'createdAt',
]) {
  @ApiProperty({ type: MovieDto, required: false })
  movieMetadata?: MovieDto;

  @ApiProperty({ type: Series, required: false })
  seriesMetadata?: Series;

  @ApiProperty({ required: false })
  watched?: boolean;
}
