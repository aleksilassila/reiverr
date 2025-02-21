import { ApiProperty } from '@nestjs/swagger';
import { MovieMetadata } from './metadata.entity';

// export class MovieUserDataDto {
//   @ApiProperty()
//   inLibrary: boolean;
// }

export class MovieDto extends MovieMetadata {
  // tmdbData: any;
  //   @ApiProperty({ type: MovieUserDataDto, required: false })
  //   userData?: MovieUserDataDto;
}
