import { MediaPluginSettings } from './settings';
import { VideoCandidate, VideoStream } from './video';

export enum Commands {
  settings = 'settings',
  getCatalogue = 'get-catalogue',
  getVideoCandidates = 'get-video-candidates',
  getSubtitles = 'get-subtitles',
  createVideoStream = 'create-video-stream',
}

export type GetVideoCandidatesDto = {
  tmdbId: string;
  season?: number;
  episode?: number;
};

export type GetVideoCandidatesResponseDto = {
  candidates: VideoCandidate[];
};

export type GetVideoStreamDto = {
  candidateId: string;
};

export type GetVideoStreamResponseDto = {
  stream: VideoStream;
};

export type MediaPluginSettingsResponseDto = {
  settings: MediaPluginSettings;
};
