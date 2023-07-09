/**
 * @deprecated - Check @/utils/playback-profiles/index
 */

import { DlnaProfileType, EncodingContext } from '@jellyfin/sdk/lib/generated-client';
import type { TranscodingProfile } from '@jellyfin/sdk/lib/generated-client';
import { getSupportedAudioCodecs } from './helpers/audio-formats';
import { getSupportedMP4AudioCodecs } from './helpers/mp4-audio-formats';
import { getSupportedMP4VideoCodecs, hasVp8Support } from './helpers/mp4-video-formats';
import { canPlayNativeHls, canPlayHlsWithMSE, hasMkvSupport } from './helpers/transcoding-formats';
import { getSupportedTsAudioCodecs } from './helpers/ts-audio-formats';
import { getSupportedTsVideoCodecs } from './helpers/ts-video-formats';
import {
	isTv,
	isApple,
	isEdge,
	isChromiumBased,
	isAndroid,
	isTizen
} from '$lib/utils/browser-detection';

/**
 * Returns a valid TranscodingProfile for the current platform.
 *
 * @param videoTestElement - A HTML video element for testing codecs
 * @returns An array of transcoding profiles for the current platform.
 */
export function getTranscodingProfiles(
	videoTestElement: HTMLVideoElement
): Array<TranscodingProfile> {
	const TranscodingProfiles: TranscodingProfile[] = [];
	const physicalAudioChannels = isTv() ? 6 : 2;

	const hlsBreakOnNonKeyFrames = !!(
		isApple() ||
		(isEdge() && !isChromiumBased()) ||
		!canPlayNativeHls(videoTestElement)
	);

	const mp4AudioCodecs = getSupportedMP4AudioCodecs(videoTestElement);
	const mp4VideoCodecs = getSupportedMP4VideoCodecs(videoTestElement);
	const canPlayHls = canPlayNativeHls(videoTestElement) || canPlayHlsWithMSE();

	if (canPlayHls) {
		TranscodingProfiles.push({
			// hlsjs, edge, and android all seem to require ts container
			Container:
				!canPlayNativeHls(videoTestElement) || (isEdge() && !isChromiumBased()) || isAndroid()
					? 'ts'
					: 'aac',
			Type: DlnaProfileType.Audio,
			AudioCodec: 'aac',
			Context: EncodingContext.Streaming,
			Protocol: 'hls',
			MaxAudioChannels: physicalAudioChannels.toString(),
			MinSegments: isApple() ? 2 : 1,
			BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames
		});
	}

	for (const audioFormat of ['aac', 'mp3', 'opus', 'wav'].filter((format) =>
		getSupportedAudioCodecs(format)
	)) {
		TranscodingProfiles.push({
			Container: audioFormat,
			Type: DlnaProfileType.Audio,
			AudioCodec: audioFormat,
			Context: EncodingContext.Streaming,
			Protocol: 'http',
			MaxAudioChannels: physicalAudioChannels.toString()
		});
	}

	const hlsInTsVideoCodecs = getSupportedTsVideoCodecs(videoTestElement);
	const hlsInTsAudioCodecs = getSupportedTsAudioCodecs(videoTestElement);

	if (canPlayHls && hlsInTsVideoCodecs.length > 0 && hlsInTsAudioCodecs.length > 0) {
		TranscodingProfiles.push({
			Container: 'ts',
			Type: DlnaProfileType.Video,
			AudioCodec: hlsInTsAudioCodecs.join(','),
			VideoCodec: hlsInTsVideoCodecs.join(','),
			Context: EncodingContext.Streaming,
			Protocol: 'hls',
			MaxAudioChannels: physicalAudioChannels.toString(),
			MinSegments: isApple() ? 2 : 1,
			BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames
		});
	}

	if (hasMkvSupport(videoTestElement) && !isTizen()) {
		TranscodingProfiles.push({
			Container: 'mkv',
			Type: DlnaProfileType.Video,
			AudioCodec: mp4AudioCodecs.join(','),
			VideoCodec: mp4VideoCodecs.join(','),
			Context: EncodingContext.Streaming,
			MaxAudioChannels: physicalAudioChannels.toString(),
			CopyTimestamps: true
		});
	}

	if (hasVp8Support(videoTestElement)) {
		TranscodingProfiles.push({
			Container: 'webm',
			Type: DlnaProfileType.Video,
			AudioCodec: 'vorbis',
			VideoCodec: 'vpx',
			Context: EncodingContext.Streaming,
			Protocol: 'http',
			// If audio transcoding is needed, limit channels to number of physical audio channels
			// Trying to transcode to 5 channels when there are only 2 speakers generally does not sound good
			MaxAudioChannels: physicalAudioChannels.toString()
		});
	}

	return TranscodingProfiles;
}
