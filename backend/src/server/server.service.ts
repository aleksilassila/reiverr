import { Injectable } from '@nestjs/common';
import { DeletionService } from '../library/deletion.service.js';
import { FulfilmentService } from '../library/fulfilment.service.js';
import {
  CleanupPreviewDto,
  DeleteLibraryEntriesResultDto,
  LibraryScanPreviewDto,
  ScanLibraryResultDto,
} from '../library/library.dto.js';
import { LibraryService } from '../library/library.service.js';
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
    private readonly libraryService: LibraryService,
    private readonly deletionService: DeletionService,
    private readonly fulfilmentService: FulfilmentService,
    private readonly requestsService: RequestsService,
  ) {}

  async getLibraryEntries(folder: string): Promise<ServerLibraryEntryDto[]> {
    const entries = await this.libraryService.getLibraryEntries(folder);
    const requests = await this.fulfilmentService.countByMediaFile();

    return entries.map((entry) => ({
      ...entry,
      requests: entry.mediaFileId
        ? (requests.get(entry.mediaFileId) ?? 0)
        : undefined,
    }));
  }

  async previewLibraryScan(folder: string): Promise<LibraryScanPreviewDto> {
    const { available, reason, missing } =
      await this.libraryService.previewScan(folder);
    const requests = await this.fulfilmentService.countByMediaFile();

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
    return this.libraryService.scanFolder(folder, {
      evenIfUnavailable: force,
    });
  }

  /** A dry run of the cleanup of unretained files */
  async previewCleanup(): Promise<CleanupPreviewDto> {
    const files = await this.deletionService.cleanUpLibrary(true);

    return {
      files: files.length,
      size: files.reduce((sum, file) => sum + file.size, 0),
    };
  }

  /** Queues the nightly cleanup, and tells what it was queued for */
  async runCleanup(): Promise<CleanupPreviewDto> {
    const preview = await this.previewCleanup();
    await this.deletionService.cleanUpLibrary();
    return preview;
  }

  async requestLibraryEntries(
    admin: User,
    folder: string,
    paths: string[],
  ): Promise<RequestLibraryEntriesResultDto> {
    const files = await this.libraryService.findLibraryEntryFiles(
      folder,
      paths,
    );

    return this.requestsService.requestFiles(admin.id, files);
  }

  async manageLibraryEntries(
    folder: string,
    paths: string[],
  ): Promise<ManageLibraryEntriesResultDto> {
    const { changed } = await this.libraryService.setLibraryEntriesManaged(
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
    const { changed } = await this.libraryService.setLibraryEntriesManaged(
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
    return this.deletionService.deleteLibraryEntries(
      folder,
      paths,
      `deleted by ${admin.name}`,
    );
  }
}
