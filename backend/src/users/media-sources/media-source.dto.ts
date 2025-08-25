import {
  ApiExtraModels,
  ApiProperty,
  getSchemaPath,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { PickAndPartial } from 'src/common/common.dto';
import {
  StreamCandidateDto,
  ValidationResponseDto,
} from 'src/source-providers/source-provider.dto';
import { MediaSource } from './media-source.entity';
import {
  CatalogueCapabilities,
  DirectionOption,
  OrderOption,
  MediaSourceViews,
  MediaSourceView,
  GeneralView,
  ListWithDetailsView,
  ActionElement,
  ExternalLinkElement,
  HeadingElement,
  InputElement,
  OpenViewElement,
  SelectElement,
  ToggleElement,
  ListWithDetailsItem,
  SortableProperty,
  StreamActionElement,
  MediaSourceProvider,
} from '@aleksilassila/reiverr-shared';
import { ViewBaseDto } from 'src/source-providers/ui.dto';

class CatalogueOrderDirectionOption implements DirectionOption {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string;
}

class OrderOptionDto implements OrderOption {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string;

  @ApiProperty({ type: [CatalogueOrderDirectionOption] })
  directions: CatalogueOrderDirectionOption[];
}

export class CatalogueCapability {
  @ApiProperty()
  isSupported: boolean;

  @ApiProperty({ type: [OrderOptionDto] })
  orderOptions: OrderOptionDto[];
}

export class CatalogueCapabilitiesDto implements CatalogueCapabilities {
  @ApiProperty({ type: CatalogueCapability })
  combinedCatalogue: CatalogueCapability;

  @ApiProperty({ type: CatalogueCapability })
  missingCatalogue: CatalogueCapability;

  @ApiProperty({ type: CatalogueCapability })
  moviesCatalogue: CatalogueCapability;

  @ApiProperty({ type: CatalogueCapability })
  seriesCatalogue: CatalogueCapability;
}

export class MediaSourceCapabilitiesDto {
  @ApiProperty({ type: CatalogueCapabilitiesDto })
  catalogueCapabilities: CatalogueCapabilitiesDto;
}

export class MediaSourceDto extends PickAndPartial(
  MediaSource,
  [
    'id',
    'pluginId',
    'name',
    'userId',
    'adminControlled',
    'enabled',
    'priority',
  ],
  ['pluginSettings'],
) {
  // @ApiProperty()
  // capabilities: MediaSourceCapabilitiesDto;

  @ApiProperty({ type: CatalogueCapabilitiesDto })
  catalogueCapabilities: CatalogueCapabilitiesDto;
}

export class UpdateOrCreateMediaSourceDto extends PickAndPartial(
  MediaSource,
  ['pluginSettings', 'pluginId'],
  ['id', 'adminControlled', 'name', 'priority'],
) {}

export class UpdateMediaSourceDto extends OmitType(PartialType(MediaSource), [
  'id',
  'pluginId',
  'userId',
]) {}

export class CreateMediaSourceDto extends OmitType(MediaSource, [
  'id',
  'userId',
]) {}

export class UpdateMediaSourceResponseDto {
  @ApiProperty({ type: MediaSourceDto })
  mediaSource: MediaSourceDto;

  @ApiProperty({ type: ValidationResponseDto, required: false })
  validationResponse: ValidationResponseDto | undefined;
}

export class ViewProviderDto {
  @ApiProperty()
  view: ViewBaseDto;

  @ApiProperty()
  sourceId: string;
}

export class ViewGroupDto {
  @ApiProperty()
  label: string;

  @ApiProperty({ type: [ViewProviderDto] })
  viewProviders: ViewProviderDto[];
}

export class ViewProvidersResponseDto {
  @ApiProperty({ type: [ViewGroupDto] })
  viewGroups: ViewGroupDto[];
}

export class HeadingElementDto implements HeadingElement {
  @ApiProperty({ type: 'string', enum: ['heading'] })
  type: 'heading';

  @ApiProperty()
  label: string;

  @ApiProperty({ required: false })
  description?: string;
}

export class ToggleElementDto implements ToggleElement {
  @ApiProperty({ type: 'string', enum: ['toggle'] })
  type: 'toggle';

  @ApiProperty()
  label: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  value: boolean;

  @ApiProperty({ enum: ['checkbox', 'switch'] })
  style: 'checkbox' | 'switch';
}

class SelectOptionDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string;
}

export class SelectElementDto implements SelectElement {
  @ApiProperty({ type: 'string', enum: ['select'] })
  type: 'select';

  @ApiProperty()
  label: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  value: string;

  @ApiProperty({
    type: [SelectOptionDto],
  })
  options: SelectOptionDto[];

  @ApiProperty({ enum: ['dropdown', 'radio'] })
  style: 'dropdown' | 'radio';
}

class IconDto {
  @ApiProperty({
    enum: ['play', 'download', 'delete', 'info', 'external-link'],
  })
  type: 'play' | 'download' | 'delete' | 'info' | 'external-link';

  @ApiProperty({ enum: ['lg', 'md', 'sm'], required: false })
  size?: 'lg' | 'md' | 'sm';
}

class StreamActionIconDto extends IconDto {
  @ApiProperty({ enum: ['play'] })
  type: 'play';
}

export class StreamActionElementDto implements StreamActionElement {
  @ApiProperty({ type: 'string', enum: ['action'] })
  type: 'action';

  @ApiProperty({ type: 'string', enum: ['Stream'] })
  label: 'Stream';

  @ApiProperty({ type: 'string', enum: ['stream'] })
  action: 'stream';

  @ApiProperty({ type: StreamActionIconDto })
  icon: StreamActionIconDto;

  @ApiProperty({ required: false })
  disabled?: boolean;
}

export class ActionElementDto implements ActionElement {
  @ApiProperty({ type: 'string', enum: ['action'] })
  type: 'action';

  @ApiProperty()
  label: string;

  @ApiProperty()
  action: string;

  @ApiProperty({ required: false })
  disabled?: boolean;

  @ApiProperty({ required: false, type: IconDto })
  icon?: IconDto;
}

export class InputElementDto implements InputElement {
  @ApiProperty({ type: 'string', enum: ['input'] })
  type: 'input';

  @ApiProperty()
  label: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  value: string;

  @ApiProperty({ required: false })
  placeholder?: string;

  @ApiProperty({
    type: 'string',
    enum: ['number', 'text', 'email', 'password'],
  })
  style: 'number' | 'text' | 'email' | 'password';

  @ApiProperty({ type: 'number', required: false })
  min?: number;

  @ApiProperty({ type: 'number', required: false })
  max?: number;

  @ApiProperty({ type: 'number', required: false })
  maxLength?: number;

  @ApiProperty({ type: 'number', required: false })
  minLength?: number;

  @ApiProperty({ type: 'boolean', required: false })
  disabled?: boolean;
}

export class ExternalLinkElementDto implements ExternalLinkElement {
  @ApiProperty({ type: 'string', enum: ['external-link'] })
  type: 'external-link';

  @ApiProperty()
  label: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ required: false, type: IconDto })
  icon?: IconDto;
}

export class OpenViewElementDto implements OpenViewElement {
  @ApiProperty({ type: 'string', enum: ['open-view'] })
  type: 'open-view';

  @ApiProperty()
  label: string;

  @ApiProperty()
  viewId: string;

  @ApiProperty({ required: false, type: IconDto })
  icon?: IconDto;
}

@ApiExtraModels(
  HeadingElementDto,
  ToggleElementDto,
  SelectElementDto,
  StreamActionElementDto,
  ActionElementDto,
  InputElementDto,
  ExternalLinkElementDto,
  OpenViewElementDto,
)
export class GeneralViewDto implements GeneralView {
  @ApiProperty({ type: 'string', enum: ['general'] })
  type: 'general';

  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(HeadingElementDto) },
        { $ref: getSchemaPath(ToggleElementDto) },
        { $ref: getSchemaPath(SelectElementDto) },
        { $ref: getSchemaPath(StreamActionElementDto) },
        { $ref: getSchemaPath(ActionElementDto) },
        { $ref: getSchemaPath(InputElementDto) },
        { $ref: getSchemaPath(ExternalLinkElementDto) },
        { $ref: getSchemaPath(OpenViewElementDto) },
      ],
    },
  })
  elements: (
    | HeadingElement
    | ToggleElement
    | SelectElement
    | ActionElement
    | InputElement
    | ExternalLinkElement
    | OpenViewElement
  )[];
  id: string;
  label: string;
  priority?: number;
}

export class SortablePropertyDto implements SortableProperty {
  @ApiProperty()
  label: string;

  @ApiProperty({ oneOf: [{ type: 'string ' }, { type: 'number' }] })
  value: string | number;

  @ApiProperty()
  formatted: string;

  @ApiProperty({ required: false })
  secondary?: boolean;
}

@ApiExtraModels(StreamActionElementDto, ActionElementDto, OpenViewElementDto)
export class ListWithDetailsItemDto implements ListWithDetailsItem {
  @ApiProperty({ type: 'string' })
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  description?: string;

  @ApiProperty({ type: [SortablePropertyDto] })
  properties: SortablePropertyDto[];

  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(StreamActionElementDto) },
        { $ref: getSchemaPath(ActionElementDto) },
        { $ref: getSchemaPath(OpenViewElementDto) },
      ],
    },
  })
  actions: (ActionElementDto | OpenViewElementDto)[];
}

export class ListWithDetailsViewDto implements ListWithDetailsView {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: 'string', enum: ['list-with-details'] })
  type: 'list-with-details';

  @ApiProperty()
  label: string;

  @ApiProperty({ required: false })
  priority?: number;

  @ApiProperty({ type: [ListWithDetailsItemDto] })
  items: ListWithDetailsItemDto[];

  @ApiProperty({ required: false, type: OrderOptionDto })
  order?: OrderOption;

  @ApiProperty({ type: [OrderOptionDto] })
  orderOptions: OrderOption[];
}

@ApiExtraModels(GeneralViewDto, ListWithDetailsViewDto)
export class MediaSourceViewResponseDto {
  @ApiProperty({
    oneOf: [
      {
        $ref: getSchemaPath(GeneralViewDto),
      },
      {
        $ref: getSchemaPath(ListWithDetailsViewDto),
      },
    ],
  })
  view: GeneralViewDto | ListWithDetailsViewDto;

  // @ApiProperty({ required: false, type: GeneralViewDto })
  // generalView?: GeneralViewDto;

  // @ApiProperty({ required: false, type: ListWithDetailsViewDto })
  // listWithDetailsView?: ListWithDetailsViewDto;
}

export class ProviderWithStreamsDto {
  @ApiProperty()
  provider: MediaSourceDto;

  @ApiProperty({ type: [StreamCandidateDto] })
  streams: StreamCandidateDto[];
}
