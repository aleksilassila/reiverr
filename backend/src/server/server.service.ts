import { BadRequestException, Injectable } from '@nestjs/common';
import * as path from 'path';
import { DeletionService } from '../library/deletion.service.js';
import {
  isDirectory,
  measureDisk,
  readDirectory,
} from '../library/disk.utils.js';
import { FulfilmentService } from '../library/fulfilment.service.js';
import {
  CleanupPreviewDto,
  DeleteLibraryEntriesResultDto,
  LibraryScanPreviewDto,
  ScanLibraryResultDto,
} from '../library/library.dto.js';
import { LibraryService } from '../library/library.service.js';
import { describeError } from '../library/library.utils.js';
import { ScanService } from '../library/scan.service.js';
import { RequestsService } from '../requests/requests.service.js';
import { User } from '../users/user.entity.js';
import {
  DirectoryEntryDto,
  DirectoryListingDto,
  ManageLibraryEntriesResultDto,
  RequestLibraryEntriesResultDto,
  ServerLibraryEntryDto,
} from './server.dto.js';

/** What the server page shows admins of the server and lets them do to it */
@Injectable()
export class ServerService {
  constructor(
    private readonly libraryService: LibraryService,
    private readonly scanService: ScanService,
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

  /** The directories in a directory: one level of the filesystem, for picking a library folder */
  async listDirectory(requested: string): Promise<DirectoryListingDto> {
    if (typeof requested !== 'string' || !requested) {
      throw new BadRequestException('path is required');
    }
    const dir = path.resolve(requested);
    const dirents = await readDirectory(dir).catch((error) => {
      throw new BadRequestException(
        `Cannot read "${dir}": ${describeError(error)}`,
      );
    });

    const entries: DirectoryEntryDto[] = [];
    for (const entry of dirents) {
      if (!(await isDirectory(entry, dir))) continue;
      entries.push({
        name: entry.name,
        path: path.join(dir, entry.name),
        isSymbolicLink: entry.isSymbolicLink(),
      });
    }
    const parent = path.dirname(dir);

    return {
      path: dir,
      parent: parent === dir ? null : parent,
      disk: await measureDisk(dir),
      entries,
    };
  }

  async previewLibraryScan(folder: string): Promise<LibraryScanPreviewDto> {
    const { available, reason, missing } =
      await this.scanService.previewScan(folder);
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
    return this.scanService.scanFolder(folder, {
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
