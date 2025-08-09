import {
    SourceProviderSettings
} from './types';

/**
 * MediaSourceProvider is a class that handles all requests for Reiverr users that have configured the plugin as MediaSource. A new MediaSourceProvider is instantiated for each request / function call, and it contains data about the Reiverr user that called the function.
 */

export class WithMediaSource {
  /**
   * An id unique to each Reiverr user
   */
  protected userId: string;

  /**
   * The id of the MediaSource instance that the user is using to access the SourceProvider
   */
  protected sourceId: string;

  /**
   * @see SourceProviderSettings
   */
  protected settings: SourceProviderSettings;

  constructor(options: {
    userId: string;
    sourceId: string;
    settings: SourceProviderSettings;
  }) {
    this.userId = options.userId;
    this.sourceId = options.sourceId;
    this.settings = options.settings;
  }
}
