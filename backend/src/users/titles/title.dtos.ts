import { Title } from './title.entity';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Media } from './media.entity';

export class TitleDto extends Title {
  static fromEntity(title: Title): TitleDto {
    return title;
  }
}

export class UpdateTitleDto extends PartialType(
  OmitType(Title, ['user', 'id', 'tmdbId']),
) {}

export class UpdateProgressDto {
  @ApiProperty({ required: false })
  progress?: number;

  @ApiProperty({ required: false })
  watched?: boolean;
}

export class ContinueWatchingDto {
  @ApiProperty({ required: false, type: Media, nullable: true })
  nextEpisode?: Media;

  @ApiProperty({ type: Title })
  title: Title;
}
