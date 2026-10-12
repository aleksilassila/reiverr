import { Injectable } from '@nestjs/common';
import {
  DeleteLibraryEntriesResultDto,
  ScanLibraryResultDto,
  LibraryScanPreviewDto,
} from '../local-media/local-media.dto.js';
import { CleanupService } from '../local-media/cleanup.service.js';
import { LocalMediaService } from '../local-media/local-media.service.js';
import { RequestsService } from '../requests/requests.service.js';
import { User } from '../users/user.entity.js';
import {
  ManageLibraryEntriesResultDto,
  RequestLibraryEntriesResultDto,
  ServerLibraryEntryDto,
} from './server.dto.js';

/** What the server page shows admins of the server and lets them do to it */
@Injectable()
export class ServerService {
  constructor(
    private readonly localMediaService: LocalMediaService,
    private readonly requestsService: RequestsService,
    private readonly cleanupService: CleanupService,
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

  async previewLibraryScan(folder: string): Promise<LibraryScanPreviewDto> {
    const { available, reason, missing } =
      await this.localMediaService.previewScan(folder);
    const requests = await this.requestsService.countByMediaFile();

    return {
      available,
      reason,
      missing: missing.length,
      requests: missing.reduce(
        (sum, file) => sum + (requests.get(file.id) ?? 0),
        0,
      ),
    };
  }

  scanLibrary(folder: string, force: boolean): Promise<ScanLibraryResultDto> {
    return this.localMediaService.scanFolder(folder, {
      evenIfUnavailable: force,
    });
  }

  async requestLibraryEntries(
    admin: User,
    folder: string,
    paths: string[],
  ): Promise<RequestLibraryEntriesResultDto> {
    const files = await this.localMediaService.findLibraryEntryFiles(
      folder,
      paths,
    );

    return this.requestsService.requestFiles(admin.id, files);
  }

  async manageLibraryEntries(
    folder: string,
    paths: string[],
  ): Promise<ManageLibraryEntriesResultDto> {
    const { changed } = await this.localMediaService.setLibraryEntriesManaged(
      folder,
      paths,
      true,
    );

    return { files: changed };
  }

  async unmanageLibraryEntries(
    folder: string,
    paths: string[],
  ): Promise<ManageLibraryEntriesResultDto> {
    const { changed } = await this.localMediaService.setLibraryEntriesManaged(
      folder,
      paths,
      false,
    );

    return { files: changed };
  }

  deleteLibraryEntries(
    admin: User,
    folder: string,
    paths: string[],
  ): Promise<DeleteLibraryEntriesResultDto> {
    return this.cleanupService.deleteLibraryEntries(
      folder,
      paths,
      `deleted by ${admin.name}`,
    );
  }
}
