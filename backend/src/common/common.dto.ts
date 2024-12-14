import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponse, PaginationParams } from 'plugins/plugin-types';

export class PaginatedResponseDto<T> implements PaginatedResponse<T> {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  itemsPerPage: number;

  // @ApiProperty()
  items: T[];
}

export class PaginationParamsDto implements PaginationParams {
  @ApiProperty()
  page: number;

  @ApiProperty()
  itemsPerPage: number;
}

export class SuccessResponseDto {
  @ApiProperty()
  success: boolean;
}