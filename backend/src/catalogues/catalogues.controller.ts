import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { GetAuthToken, GetAuthUser } from 'src/auth/auth.guard';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
  PaginationApiQuery,
} from 'src/common/common.decorator';
import { PaginatedResponseDto, PaginationDto } from 'src/common/common.dto';
import { MetadataService } from 'src/metadata/metadata.service';
import { PluginsService } from 'src/plugins/plugins.service';
import { User } from 'src/users/user.entity';
import { CatalogueDto, CatalogueItemsDto } from './dtos/catalogues.dto';
import {
  CatalogueResponse,
  CataloguesResponse,
} from '@aleksilassila/reiverr-shared';

@ApiTags('catalogues')
@Controller('catalogues')
export class CataloguesController {
  constructor(
    private readonly pluginsService: PluginsService,
    private readonly metadataService: MetadataService,
  ) {}

  @Get()
  @PaginatedApiOkResponse(CatalogueDto)
  async getCatalogues(
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
  ): Promise<PaginatedResponseDto<CatalogueDto>> {
    const catalogueServices = this.pluginsService.getCatalogueServices();

    const groupResponses = catalogueServices.map(
      async (s): Promise<CatalogueDto[]> => {
        const response: CataloguesResponse = await firstValueFrom(
          s.catalogueService!.GetCatalogues({}),
        ).catch((e) => ({ catalogues: [] }));

        return response.catalogues.map((c) => ({
          ...c,
          pluginId: s.config.id,
          pluginLabel: s.config.id,
        }));
      },
    );

    const groups = await Promise.all(groupResponses).then((results) =>
      results.flat(),
    );

    return {
      items: groups,
      total: groups.length,
      itemsPerPage: groups.length,
      page: 1,
    };
  }

  @Get('catalogue')
  @ApiQuery({ name: 'pluginId', required: true, type: String })
  @ApiQuery({ name: 'catalogueId', required: true, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  @PaginationApiQuery()
  @ApiOkResponse({
    type: CatalogueItemsDto,
  })
  async getCatalogue(
    @Query('pluginId') pluginId: string,
    @Query('catalogueId') catalogueId: string,
    @GetPaginationParams() pagination: PaginationDto,
    @Query('order') order?: string,
    @GetAuthUser() user?: User,
    @GetAuthToken() token?: string,
  ): Promise<CatalogueItemsDto> {
    const catalogueService = this.pluginsService
      .getCatalogueServices()
      .find(
        (s) => s.config.id === pluginId && s.catalogueService,
      )?.catalogueService;

    if (!catalogueService || !catalogueId) {
      throw new NotFoundException('Catalogue not found');
    }

    const catalogueResponse = await firstValueFrom(
      catalogueService.GetCatalogue({
        catalogueId,
        order,
        pagination: {
          page: pagination.page,
          itemsPerPage: pagination.itemsPerPage,
        },
      }),
    ).catch((e) => {
      throw new NotFoundException('Catalogue not found');
    });

    const tmdbItems = catalogueResponse.items.map(async (i) =>
      this.metadataService.getTmdbItem(i.tmdbId, i.mediaType),
    );

    return {
      items: await Promise.all(tmdbItems),
    };
  }
}
