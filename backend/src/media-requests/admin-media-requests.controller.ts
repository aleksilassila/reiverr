import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminAccessControl } from 'src/auth/auth.guard';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
  PaginationApiQuery,
} from 'src/common/common.decorator';
import {
  PaginatedResponseDto,
  PaginationDto,
  SuccessResponseDto,
} from 'src/common/common.dto';
import {
  AdminMediaRequestDto,
  UpdateMediaRequestDto,
} from './media-requests.dto';
import { MediaRequestsService } from './media-requests.service';

@ApiTags('media-requests')
@Controller('v2/media-requests')
@UseGuards(AdminAccessControl)
export class AdminMediaRequestsController {
  constructor(private readonly mediaRequestsService: MediaRequestsService) {}

  @Get()
  @ApiQuery({ name: 'approved', type: Boolean, required: false })
  @PaginationApiQuery()
  @PaginatedApiOkResponse(AdminMediaRequestDto)
  async getAllMediaRequests(
    @GetPaginationParams() pagination: PaginationDto,
    @Query('approved', new ParseBoolPipe({ optional: true }))
    approved?: boolean,
  ): Promise<PaginatedResponseDto<AdminMediaRequestDto>> {
    return this.mediaRequestsService.findAll(pagination, approved);
  }

  @Put(':id')
  @ApiOkResponse({ type: AdminMediaRequestDto })
  async updateMediaRequest(
    @Param('id') id: string,
    @Body() body: UpdateMediaRequestDto,
  ): Promise<AdminMediaRequestDto> {
    return this.mediaRequestsService.update(id, body);
  }

  @Delete(':id')
  @ApiOkResponse({ type: SuccessResponseDto })
  async deleteMediaRequest(
    @Param('id') id: string,
  ): Promise<SuccessResponseDto> {
    const result = await this.mediaRequestsService.deleteById(id);

    return { success: result.affected > 0 };
  }
}
