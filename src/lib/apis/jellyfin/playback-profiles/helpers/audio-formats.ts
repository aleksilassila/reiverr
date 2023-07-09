/**
 * @deprecated - Check @/utils/playback-profiles/index
 */

import { isApple, isTizen, isTv, isWebOS } from '$lib/utils/browser-detection';

/**
 * Determines if audio codec is supported
 */
export function getSupportedAudioCodecs(format: string): boolean {
	let typeString;

	if (format === 'flac' && isTv()) {
		return true;
	} else if (format === 'wma' && isTizen()) {
		return true;
	} else if (format === 'asf' && isTv()) {
		return true;
	} else if (format === 'opus') {
		if (!isWebOS()) {
			typeString = 'audio/ogg; codecs="opus"';

			return !!document.createElement('audio').canPlayType(typeString).replace(/no/, '');
		}

		return false;
	} else if (format === 'alac' && isApple()) {
		return true;
	} else if (format === 'webma') {
		typeString = 'audio/webm';
	} else if (format === 'mp2') {
		typeString = 'audio/mpeg';
	} else {
		typeString = 'audio/' + format;
	}

	return !!document.createElement('audio').canPlayType(typeString).replace(/no/, '');
}
