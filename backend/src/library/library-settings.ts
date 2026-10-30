import { SettingsService } from '../settings/settings.service.js';
import { CleanupSchedule, LibrarySettingsDto } from './library.dto.js';

/** The key of the library settings in the settings store */
export const LIBRARY_SETTINGS_KEY = 'library';

export const DEFAULT_LIBRARY_SETTINGS: LibrarySettingsDto = {
  movieFolders: {},
  seriesFolders: {},
  cleanup: CleanupSchedule.Daily,
  maxDiskUsagePercent: null,
};

/**
 * The library folders, the cleanup schedule and the disk limit. Read here
 * by the index, which also writes them, and by the storage, so that the
 * storage does not depend on the index.
 */
export function readLibrarySettings(
  settingsService: SettingsService,
): Promise<LibrarySettingsDto> {
  return settingsService.getOrCreateValue(
    LIBRARY_SETTINGS_KEY,
    DEFAULT_LIBRARY_SETTINGS,
  );
}
