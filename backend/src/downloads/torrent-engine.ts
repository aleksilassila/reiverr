export const TORRENT_ENGINE = 'TORRENT_ENGINE';

/** A file of a torrent, as the torrent lists it */
export interface TorrentFileInfo {
  index: number;
  name: string;
  /** Path inside the torrent */
  path: string;
  length: number;
}

export interface TorrentStats {
  peers: number;
  /** Bytes per second */
  downloadSpeed: number;
  uploadSpeed: number;
  /** Bytes transferred since the torrent was added */
  downloaded: number;
  uploaded: number;
}

/** What the engine knows of a torrent at one moment */
export interface TorrentState {
  /** The file list is known and data from an earlier run is verified */
  ready: boolean;
  /** The files, once ready */
  files?: TorrentFileInfo[];
  /** Why the torrent failed, once it has */
  error?: string;
  /** The files that download, by index */
  wanted: number[];
  /** The files that are downloaded and written to disk, by index; none until ready */
  complete: number[];
  /** Whether any part of the torrent is on disk; false until ready */
  hasData: boolean;
  stats: TorrentStats;
}

export interface TorrentHandle {
  getState(): TorrentState;
  /** Downloads these files and nothing else */
  setWantedFiles(indexes: number[]): void;
  /** Share of the file that is downloaded, from 0 to 1; 0 until ready */
  getFileProgress(index: number): number;
  getFilePath(index: number): string;
  /** Called when the torrent becomes ready, fails, or completes a wanted file */
  onChange(listener: () => void): void;
  /** Stops all transfers. Downloaded data stays on disk. */
  destroy(): Promise<void>;
}

export interface TorrentEngine {
  /**
   * Starts a torrent from a magnet link or the contents of a .torrent file.
   * Nothing is downloaded until files are wanted, data it has is seeded.
   */
  add(source: string | Buffer, directory: string): TorrentHandle;
}
