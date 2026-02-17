import {
  BulkUpdateRequestsRequest,
  CreateRequestsRequest,
  CreateRequestsResponse,
  DeleteRequestsResponse,
  MediaItem,
  QueueItem,
  RequestItem,
  RequestProfile,
  RequestsResponse,
  UpdateQueueRequest,
  UpdateRequestsResponse,
  WatchStatus,
} from '@aleksilassila/reiverr-shared';
import { ApiProperty } from '@nestjs/swagger';

// Ids a media item for the plugin
export class MediaItemDto implements MediaItem {
  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  season?: number;

  @ApiProperty({ required: false })
  episode?: number;

  @ApiProperty({ required: false })
  tmdbId?: string;

  @ApiProperty({ required: false })
  imdbId?: string;

  @ApiProperty({ required: false })
  tvdbId?: string;
}

export class RequestProfileDto implements RequestProfile {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  canAdd: boolean;

  @ApiProperty()
  canDisable: boolean;

  @ApiProperty()
  canDelete: boolean;

  @ApiProperty()
  hasQueue: boolean;

  @ApiProperty({ required: false, enum: ['single', 'multiple', 'ordered'] })
  queueType?: string;

  // Additional properties

  @ApiProperty()
  pluginId: string;

  @ApiProperty()
  pluginLabel: string;
}

export class RequestDto implements RequestItem {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: MediaItemDto })
  mediaItem: MediaItemDto;

  @ApiProperty()
  profileId: string;

  @ApiProperty({
    enum: ['fulfilled', 'unfulfilled', 'downloading', 'inactive', 'disabled'],
  })
  status: string;

  // Additional properties

  @ApiProperty()
  pluginId: string;
}

export class QueueItemDto implements QueueItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  selected: boolean;

  @ApiProperty()
  disabled: boolean;

  @ApiProperty({ required: false })
  priority?: number;

  @ApiProperty({ required: false })
  auto?: boolean;
}

///

export class RequestsDto implements RequestsResponse {
  @ApiProperty({ type: [RequestProfileDto] })
  profiles: RequestProfileDto[];

  @ApiProperty({ type: [RequestDto] })
  items: RequestDto[];

  // Additional properties

  @ApiProperty()
  pluginId: string;

  @ApiProperty()
  label: string;
}

export class CreateRequestsBodyDto implements CreateRequestsRequest {
  @ApiProperty({ type: [MediaItemDto] })
  mediaItems: MediaItemDto[];

  @ApiProperty()
  profileId: string;

  @ApiProperty({ required: false })
  disabled?: boolean;
}

export class CreateRequestsDto implements CreateRequestsResponse {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [RequestDto] })
  items: RequestDto[];
}

export class BulkUpdateRequestsBodyDto implements BulkUpdateRequestsRequest {
  @ApiProperty({ type: [String] })
  requestIds: string[];

  @ApiProperty({ required: false })
  disabled?: boolean;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Unused in the dto',
  })
  watchStatuses: WatchStatus[];
}

export class UpdateRequestDto implements UpdateRequestsResponse {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [RequestDto] })
  items: RequestDto[];
}

export class UpdateQueueBodyDto implements UpdateQueueRequest {
  @ApiProperty()
  requestId: string;

  @ApiProperty({ type: [String] })
  queueItemIds: string[];
}

export class DeleteRequestDto implements DeleteRequestsResponse {
  @ApiProperty()
  success: boolean;
}
