import type { Release } from '../../apis/combined-types';

export type GrabRelease = (release: Release) => Promise<boolean>;
export type DeleteFile = (id: number) => Promise<boolean>;
