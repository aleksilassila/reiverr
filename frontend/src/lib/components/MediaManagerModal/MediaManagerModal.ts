import type { Release } from '../../apis/combined-types';

export type GrabReleaseFn = (release: Release) => Promise<boolean>;
export type DeleteFileFn = (id: number) => Promise<boolean>;
export type DeleteFilesFn = (ids: number[]) => Promise<boolean>;
export type CancelDownloadFn = (downloadId: number) => Promise<boolean>;
export type CancelDownloadsFn = (downloadIds: number[]) => Promise<boolean>;
