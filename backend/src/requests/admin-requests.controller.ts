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
import { AdminAccessControl } from '../auth/auth.guard.js';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
  PaginationApiQuery,
} from '../common/common.decorator.js';
import {
  PaginatedResponseDto,
  PaginationDto,
  SuccessResponseDto,
} from '../common/common.dto.js';
import { AdminMediaRequestDto, UpdateMediaRequestDto } from './requests.dto.js';
import { RequestsService } from './requests.service.js';

@ApiTags('requests')
@Controller('requests')
@UseGuards(AdminAccessControl)
export class AdminRequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @ApiQuery({ name: 'approved', type: Boolean, required: false })
  @PaginationApiQuery()
  @PaginatedApiOkResponse(AdminMediaRequestDto)
  async getRequests(
    @GetPaginationParams() pagination: PaginationDto,
    @Query('approved', new ParseBoolPipe({ optional: true }))
    approved?: boolean,
  ): Promise<PaginatedResponseDto<AdminMediaRequestDto>> {
    return this.requestsService.findAll(pagination, approved);
  }

  @Put(':id')
  @ApiOkResponse({ type: AdminMediaRequestDto })
  async updateRequest(
    @Param('id') id: string,
    @Body() body: UpdateMediaRequestDto,
  ): Promise<AdminMediaRequestDto> {
    return this.requestsService.update(id, body);
  }

  @Delete(':id')
  @ApiOkResponse({ type: SuccessResponseDto })
  async deleteRequest(@Param('id') id: string): Promise<SuccessResponseDto> {
    const result = await this.requestsService.deleteById(id);

    return { success: result > 0 };
  }
}
