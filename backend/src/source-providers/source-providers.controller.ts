import { SourceProvider } from '@aleksilassila/reiverr-plugin';
import {
  Body,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  PipeTransform,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  GetAuthToken,
  GetAuthUser,
  UserAccessControl,
} from 'src/auth/auth.guard';
import { User } from 'src/users/user.entity';
import {
  PluginSettingsDto,
  PluginSettingsTemplateDto,
  SourceProviderCapabilitiesDto,
  ValidationResponseDto,
} from './source-provider.dto';
import { SourceProvidersService } from './source-providers.service';

export const JELLYFIN_DEVICE_ID = 'Reiverr Client';

@Injectable()
export class GetSourceProviderPipe implements PipeTransform {
  constructor(private readonly sourcesService: SourceProvidersService) {}

  async transform(providerId: string) {
    const provider = this.sourcesService.getProvider(providerId);

    if (!provider) {
      throw new NotFoundException('Plugin not found');
    }

    return provider;
  }
}

@ApiTags('providers')
@Controller('providers')
@UseGuards(UserAccessControl)
export class SourceProvidersController {
  constructor(private sourceProvidersService: SourceProvidersService) {}

  @Get()
  @ApiOkResponse({
    description: 'All source plugins found',
    type: String,
    isArray: true,
  })
  async getSourceProviders() {
    return this.sourceProvidersService
      .getProviders()
      .then((plugins) => Object.keys(plugins));
  }

  @Get(':providerId/settings/template')
  @ApiOkResponse({
    description: 'Source settings template',
    type: PluginSettingsTemplateDto,
  })
  async getSourceSettingsTemplate(
    @Param('providerId') providerId: string,
    @GetAuthUser() callerUser: User,
  ): Promise<PluginSettingsTemplateDto> {
    const provider = this.sourceProvidersService.getProvider(providerId);

    if (!provider) {
      throw new NotFoundException('Plugin not found');
    }

    // return plugin.getSettingsTemplate(callerUser.pluginSettings?.[sourceId]);
    return {
      settings: provider.settingsManager.getSettingsTemplate(),
    };
  }

  @Post(':providerId/settings/validate')
  @ApiOkResponse({
    description: 'Source settings validation',
    type: ValidationResponseDto,
  })
  async validateSourceSettings(
    @GetAuthUser() callerUser: User,
    @Param('providerId') providerId: string,
    @Body() settings: PluginSettingsDto,
  ): Promise<ValidationResponseDto> {
    const provider = this.sourceProvidersService.getProvider(providerId);

    if (!provider) {
      throw new NotFoundException('Plugin not found');
    }

    return provider.settingsManager.validateSettings(settings.settings);
  }

  @Get(':providerId/capabilities')
  @ApiOkResponse({
    type: SourceProviderCapabilitiesDto,
  })
  async getSourceCapabilities(
    @GetAuthUser() user: User,
    @Param('providerId', GetSourceProviderPipe) provider: SourceProvider,
    @GetAuthToken() token: string,
  ): Promise<SourceProviderCapabilitiesDto> {
    // const settings = this.mediaSourcesService.getMediaSourceSettings(
    //   user,
    //   provider.name,
    // );

    // if (!settings) {
    //   throw new BadRequestException('Source configuration not found');
    // }

    return {
      movieIndexing: !!provider.getMovieCatalogue,
      episodeIndexing: !!provider.getEpisodeCatalogue,
      moviePlayback: !!provider.getMovieStreams && !!provider.getMovieStream,
      episodePlayback:
        !!provider.getEpisodeStreams && !!provider.getEpisodeStream,
    };
  }
}
