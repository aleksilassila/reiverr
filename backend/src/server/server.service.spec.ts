import { BadRequestException } from '@nestjs/common';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { DeletionService } from '../library/deletion.service.js';
import { FulfilmentService } from '../library/fulfilment.service.js';
import { LibraryService } from '../library/library.service.js';
import { ScanService } from '../library/scan.service.js';
import { RequestsService } from '../requests/requests.service.js';
import { ServerService } from './server.service.js';

describe('ServerService', () => {
  let root: string;
  const service = () =>
    new ServerService(
      {} as LibraryService,
      {} as ScanService,
      {} as DeletionService,
      {} as FulfilmentService,
      {} as RequestsService,
    );

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'reiverr-server-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('lists the directories in a directory, links to directories included', async () => {
    mkdirSync(path.join(root, 'tv'));
    mkdirSync(path.join(root, 'movies'));
    mkdirSync(path.join(root, '.hidden'));
    writeFileSync(path.join(root, 'notes.txt'), '');
    symlinkSync(path.join(root, 'tv'), path.join(root, 'anime'));
    symlinkSync(path.join(root, 'notes.txt'), path.join(root, 'notes-link'));
    symlinkSync(path.join(root, 'gone'), path.join(root, 'dangling'));

    const listing = await service().listDirectory(`${root}/`);

    expect(listing).toMatchObject({
      path: root,
      parent: path.dirname(root),
      entries: [
        { name: 'anime', path: path.join(root, 'anime'), isSymbolicLink: true },
        {
          name: 'movies',
          path: path.join(root, 'movies'),
          isSymbolicLink: false,
        },
        { name: 'tv', path: path.join(root, 'tv'), isSymbolicLink: false },
      ],
    });
    expect(listing.disk?.freeBytes).toBeGreaterThan(0);
    expect(listing.disk?.totalBytes).toBeGreaterThanOrEqual(
      listing.disk?.freeBytes ?? 0,
    );
  });

  it('has no parent at the root, and rejects what is not a readable directory', async () => {
    expect((await service().listDirectory('/')).parent).toBeNull();

    for (const dir of [
      '',
      path.join(root, 'notes.txt'),
      path.join(root, 'gone'),
    ]) {
      writeFileSync(path.join(root, 'notes.txt'), '');
      await expect(service().listDirectory(dir)).rejects.toThrow(
        BadRequestException,
      );
    }
  });
});
