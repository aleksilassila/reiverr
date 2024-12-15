import { ApiProperty } from '@nestjs/swagger';
import { Movie } from './metadata.entity';

// export class MovieUserDataDto {
//   @ApiProperty()
//   inLibrary: boolean;
// }

export class MovieDto extends Movie {
  // tmdbData: any;
  //   @ApiProperty({ type: MovieUserDataDto, required: false })
  //   userData?: MovieUserDataDto;
}
