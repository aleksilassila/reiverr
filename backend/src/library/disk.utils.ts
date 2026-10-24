import { Dirent, promises as fs } from 'fs';
import * as path from 'path';
import type { DiskUsageDto } from './library.dto.js';

// How many files are looked at at a time
export const STAT_BATCH_SIZE = 64;

export const byName = (a: Dirent, b: Dirent) => a.name.localeCompare(b.name);

/** What is in a directory, by name, hidden entries left out */
export async function readDirectory(dir: string): Promise<Dirent[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  return entries.filter((entry) => !entry.name.startsWith('.')).sort(byName);
}

/** Whether an entry is a directory, or a link that leads to one */
export async function isDirectory(
  entry: Dirent,
  parent: string,
): Promise<boolean> {
  if (!entry.isSymbolicLink()) return entry.isDirectory();

  const stats = await fs
    .stat(path.join(parent, entry.name))
    .catch(() => undefined);
  return stats?.isDirectory() ?? false;
}

/**
 * The disk a directory is on, as far as it can be measured: the percent is
 * of what the server can use, leaving out the blocks reserved for root
 */
export async function measureDisk(
  dir: string,
): Promise<DiskUsageDto | undefined> {
  const stats = await fs.statfs(dir).catch(() => undefined);
  if (!stats) return undefined;

  const usedBytes = (stats.blocks - stats.bfree) * stats.bsize;
  const availableBytes = stats.bavail * stats.bsize;
  const usableBytes = usedBytes + availableBytes;

  return {
    path: dir,
    totalBytes: stats.blocks * stats.bsize,
    freeBytes: availableBytes,
    usedPercent: usableBytes > 0 ? (usedBytes / usableBytes) * 100 : 0,
  };
}

/** Whether something is at a path, a dangling link included */
export const entryExists = (filePath: string) =>
  fs.lstat(filePath).then(
    () => true,
    () => false,
  );

/** Whether an indexed file is no longer a file at its path */
export const isNoLongerFile = (filePath: string) =>
  fs.stat(filePath).then(
    (stats) => !stats.isFile(),
    () => true,
  );

/** The files that are gone from disk, a batch at a time */
export async function filterGone<T extends { path: string }>(
  files: T[],
): Promise<T[]> {
  const gone: T[] = [];
  for (let i = 0; i < files.length; i += STAT_BATCH_SIZE) {
    const batch = files.slice(i, i + STAT_BATCH_SIZE);
    const isBatchGone = await Promise.all(
      batch.map((file) => isNoLongerFile(file.path)),
    );
    gone.push(...batch.filter((_, j) => isBatchGone[j]));
  }

  return gone;
}
