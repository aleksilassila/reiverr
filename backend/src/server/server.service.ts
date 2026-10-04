import { Injectable } from '@nestjs/common';
import { DownloadsService } from '../downloads/downloads.service.js';
import { DeletedLibraryEntriesDto } from '../local-media/local-media.dto.js';
import { LocalMediaService } from '../local-media/local-media.service.js';
import { RequestsService } from '../requests/requests.service.js';
import { User } from '../users/user.entity.js';
import { ServerLibraryEntryDto } from './server.dto.js';

/** What the server page shows admins of the server and lets them do to it */
@Injectable()
export class ServerService {
  constructor(
    private readonly localMediaService: LocalMediaService,
    private readonly requestsService: RequestsService,
    private readonly downloadsService: DownloadsService,
  ) {}

  async getLibraryEntries(folder: string): Promise<ServerLibraryEntryDto[]> {
    const entries = await this.localMediaService.getLibraryEntries(folder);
    const requests = await this.requestsService.countByMediaFile();

    return entries.map((entry) => ({
      ...entry,
      requests: entry.mediaFileId
        ? (requests.get(entry.mediaFileId) ?? 0)
        : undefined,
    }));
  }

  deleteLibraryEntries(
    admin: User,
    folder: string,
    paths: string[],
  ): Promise<DeletedLibraryEntriesDto> {
    return this.downloadsService.deleteLibraryEntries(
      folder,
      paths,
      `deleted by ${admin.name}`,
    );
  }
}
