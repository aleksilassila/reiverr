import {
  PlaybackConfig,
  ActionResponse,
  StreamCandidate,
  Stream,
  StreamBase,
  StreamResponse,
} from './types';
import { MediaSourceView, MediaSourceViews } from './ui.types';
import { WithMediaSource } from './with-media-source';

type PlayableContext = {
  tmdbMovie?: any;
  tmdbSeries?: any;
  tmdbEpisode?: any;
};

/**
 * MediaSourceProvider is a class that handles all requests for Reiverr users that have configured the plugin as MediaSource. A new MediaSourceProvider is instantiated for each request / function call, and it contains data about the Reiverr user that called the function.
 */
export class MediaSourceProvider extends WithMediaSource {
  /**
   * The access token of the user that can be used to authenticate requests to the backend
   * (e.g. proxy requests)
   */
  protected token: string;

  constructor(
    options: ConstructorParameters<typeof WithMediaSource>[0] & {
      token: string;
    },
  ) {
    super(options);
    this.token = options.token;
  }

  getMeidaSourceViews: (
    options: PlayableContext,
  ) => Promise<{ views: MediaSourceViews }> = async () => ({
    views: [],
  });

  getMediaSourceView: (
    options: PlayableContext & {
      id: string;
    },
  ) => Promise<{ view?: MediaSourceView }> = async () => ({});

  getAutoplayStream: (
    options: PlayableContext,
  ) => Promise<{ candidate?: StreamBase }> = async () => ({});

  getStream: (options: {
    streamId: string;
    config?: PlaybackConfig;
  }) => Promise<StreamResponse> = async () => ({});

  /**
   * Handles stream actions (e.g. stream, download, delete) for a specific stream.
   *
   * @see Stream
   */
  handleAction: (options: {
    targetId: string;
    action: string;
  }) => Promise<ActionResponse> = async () => ({
    toast: {
      title: 'Not supported',
      message: 'This action is not supported by this provider.',
      type: 'error',
    },
    error: {
      message: 'Not supported',
    },
  });

  /**
   * @deprecated
   * Returns a list of stream candidates for a movie that the user can choose to stream from.
   *
   * @see StreamCandidate
   */
  getTmdbMovieCandidates: (options: {
    tmdbMovie: any;
  }) => Promise<{ candidates: StreamCandidate[] }> = async () => ({
    candidates: [],
  });

  /**
   * @deprecated
   * Returns a list of stream candidates for an episode that the user can choose to stream from.
   *
   * @see StreamCandidate
   */
  getTmdbEpisodeCandidates: (options: {
    tmdbSeries: any;
    tmdbEpisode: any;
  }) => Promise<{ candidates: StreamCandidate[] }> = async () => ({
    candidates: [],
  });

  /**
   * This method will be called when the client makes a request to the provider's
   * proxy endpoint (e.g. /api/proxy/:providerName/:path). This can be used to
   * relay video streams and subtitles to the client, by making a request to an
   * external service and then returning the response to the client. Ideally,
   * the stream url pointed to by a `Stream` object should use the proxy endpoint
   * so that the plugin can handle the video requests here.
   */
  proxyHandler: (options: {
    req: any;
    res: any;
    uri: string;
    targetUrl?: string;
  }) => Promise<any> = async () => {};
}
