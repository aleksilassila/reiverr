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
  stream?: VideoStream;
};

export type MediaPluginSettingsResponseDto = {
  settings: MediaPluginSettings;
};

// type Asd<T = any> = {
//   registerer: (fn: T) => void;
// };

type GetVideoCandidatesFn = (dto: {
  tmdbId: string;
  season?: number;
  episode?: number;
}) => Promise<GetVideoCandidatesResponseDto>;

const handles = {
  _handlers: [],
  getAll: () => handles._handlers,
};

type TPluginResource = {
  pluginFn: (...args: any[]) => Promise<any>;
};

class PluginResource<T extends TPluginResource = TPluginResource> {
  cmd: string;
  handlerPath: string;

  constructor(opts: { cmd: string; handlerPath?: string }) {
    this.cmd = opts.cmd;
    this.handlerPath = opts.handlerPath || '/' + opts.cmd;
  }

  register(fn: T['pluginFn']) {}

  registerMiddleware(fn: T) {}
}

export const getVideoCandidates = new PluginResource<{
  pluginFn: GetVideoCandidatesFn;
}>({ cmd: 'get-video-candidates' });
