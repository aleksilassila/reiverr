import createClient from 'openapi-fetch';
import type { paths } from '$lib/jellyfin/jellyfin-types';
import { PUBLIC_JELLYFIN_API_KEY } from '$env/static/public';
import { request } from '$lib/utils';

export const JELLYFIN_DEVICE_ID = 'Reiverr Client';
export const JELLYFIN_BASE_URL = 'http://jellyfin.home';
export const JELLYFIN_USER_ID = '75dcb061c9404115a7acdc893ea6bbbc';

export const JellyfinApi = createClient<paths>({
	baseUrl: JELLYFIN_BASE_URL,
	headers: {
		Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${PUBLIC_JELLYFIN_API_KEY}"`
	}
});

export const getJellyfinContinueWatching = () =>
	request(() =>
		JellyfinApi.get('/Users/{userId}/Items/Resume', {
			params: {
				path: {
					userId: JELLYFIN_USER_ID
				},
				query: {
					limit: 8,
					mediaTypes: ['Video']
				}
			}
		}).then((r) => r.data?.Items)
	);

export const getJellyfinItemByTmdbId = () =>
	request((tmdbId: string) =>
		JellyfinApi.get('/Users/{userId}/Items', {
			params: {
				path: {
					userId: JELLYFIN_USER_ID
				},
				query: {
					hasTmdbId: true,
					recursive: true,
					isMovie: true,
					fields: ['ProviderIds']
				}
			}
		}).then((r) => r.data?.Items?.find((i) => i.ProviderIds?.Tmdb == tmdbId))
	);

export const getJellyfinPlaybackInfo = () =>
	request((id: string) =>
		JellyfinApi.post('/Items/{itemId}/PlaybackInfo', {
			params: {
				path: {
					itemId: id
				},
				query: {
					userId: JELLYFIN_USER_ID,
					startTimeTicks: 0,
					autoOpenLiveStream: true,
					maxStreamingBitrate: 140000000
				}
			},
			body: {
				DeviceProfile: {
					CodecProfiles: [
						{
							Codec: 'aac',
							Conditions: [
								{
									Condition: 'Equals',
									IsRequired: false,
									Property: 'IsSecondaryAudio',
									Value: 'false'
								}
							],
							Type: 'VideoAudio'
						},
						{
							Conditions: [
								{
									Condition: 'Equals',
									IsRequired: false,
									Property: 'IsSecondaryAudio',
									Value: 'false'
								}
							],
							Type: 'VideoAudio'
						},
						{
							Codec: 'h264',
							Conditions: [
								{
									Condition: 'NotEquals',
									IsRequired: false,
									Property: 'IsAnamorphic',
									Value: 'true'
								},
								{
									Condition: 'EqualsAny',
									IsRequired: false,
									Property: 'VideoProfile',
									Value: 'high|main|baseline|constrained baseline'
								},
								{
									Condition: 'EqualsAny',
									IsRequired: false,
									Property: 'VideoRangeType',
									Value: 'SDR'
								},
								{
									Condition: 'LessThanEqual',
									IsRequired: false,
									Property: 'VideoLevel',
									Value: '52'
								},
								{
									Condition: 'NotEquals',
									IsRequired: false,
									Property: 'IsInterlaced',
									Value: 'true'
								}
							],
							Type: 'Video'
						},
						{
							Codec: 'hevc',
							Conditions: [
								{
									Condition: 'NotEquals',
									IsRequired: false,
									Property: 'IsAnamorphic',
									Value: 'true'
								},
								{
									Condition: 'EqualsAny',
									IsRequired: false,
									Property: 'VideoProfile',
									Value: 'main'
								},
								{
									Condition: 'EqualsAny',
									IsRequired: false,
									Property: 'VideoRangeType',
									Value: 'SDR'
								},
								{
									Condition: 'LessThanEqual',
									IsRequired: false,
									Property: 'VideoLevel',
									Value: '120'
								},
								{
									Condition: 'NotEquals',
									IsRequired: false,
									Property: 'IsInterlaced',
									Value: 'true'
								}
							],
							Type: 'Video'
						},
						{
							Codec: 'vp9',
							Conditions: [
								{
									Condition: 'EqualsAny',
									IsRequired: false,
									Property: 'VideoRangeType',
									Value: 'SDR|HDR10|HLG'
								}
							],
							Type: 'Video'
						},
						{
							Codec: 'av1',
							Conditions: [
								{
									Condition: 'EqualsAny',
									IsRequired: false,
									Property: 'VideoRangeType',
									Value: 'SDR|HDR10|HLG'
								}
							],
							Type: 'Video'
						}
					],
					ContainerProfiles: [],
					DirectPlayProfiles: [
						{
							AudioCodec: 'vorbis,opus',
							Container: 'webm',
							Type: 'Video',
							VideoCodec: 'vp8,vp9,av1'
						},
						{
							AudioCodec: 'aac,mp3,opus,flac,alac,vorbis',
							Container: 'mp4,m4v',
							Type: 'Video',
							VideoCodec: 'h264,vp9,av1'
						},
						{
							Container: 'opus',
							Type: 'Audio'
						},
						{
							AudioCodec: 'opus',
							Container: 'webm',
							Type: 'Audio'
						},
						{
							Container: 'mp3',
							Type: 'Audio'
						},
						{
							Container: 'aac',
							Type: 'Audio'
						},
						{
							AudioCodec: 'aac',
							Container: 'm4a',
							Type: 'Audio'
						},
						{
							AudioCodec: 'aac',
							Container: 'm4b',
							Type: 'Audio'
						},
						{
							Container: 'flac',
							Type: 'Audio'
						},
						{
							Container: 'alac',
							Type: 'Audio'
						},
						{
							AudioCodec: 'alac',
							Container: 'm4a',
							Type: 'Audio'
						},
						{
							AudioCodec: 'alac',
							Container: 'm4b',
							Type: 'Audio'
						},
						{
							Container: 'webma',
							Type: 'Audio'
						},
						{
							AudioCodec: 'webma',
							Container: 'webm',
							Type: 'Audio'
						},
						{
							Container: 'wav',
							Type: 'Audio'
						},
						{
							Container: 'ogg',
							Type: 'Audio'
						}
					],
					MaxStaticBitrate: 100000000,
					MaxStreamingBitrate: 120000000,
					MusicStreamingTranscodingBitrate: 384000,
					ResponseProfiles: [
						{
							Container: 'm4v',
							MimeType: 'video/mp4',
							Type: 'Video'
						}
					],
					SubtitleProfiles: [
						{
							Format: 'vtt',
							Method: 'External'
						},
						{
							Format: 'ass',
							Method: 'External'
						},
						{
							Format: 'ssa',
							Method: 'External'
						}
					],
					TranscodingProfiles: [
						{
							AudioCodec: 'aac',
							BreakOnNonKeyFrames: true,
							Container: 'ts',
							Context: 'Streaming',
							MaxAudioChannels: '2',
							Protocol: 'hls',
							Type: 'Audio'
						},
						{
							AudioCodec: 'aac',
							Container: 'aac',
							Context: 'Streaming',
							MaxAudioChannels: '2',
							Protocol: 'http',
							Type: 'Audio'
						},
						{
							AudioCodec: 'mp3',
							Container: 'mp3',
							Context: 'Streaming',
							MaxAudioChannels: '2',
							Protocol: 'http',
							Type: 'Audio'
						},
						{
							AudioCodec: 'opus',
							Container: 'opus',
							Context: 'Streaming',
							MaxAudioChannels: '2',
							Protocol: 'http',
							Type: 'Audio'
						},
						{
							AudioCodec: 'wav',
							Container: 'wav',
							Context: 'Streaming',
							MaxAudioChannels: '2',
							Protocol: 'http',
							Type: 'Audio'
						},
						{
							AudioCodec: 'opus',
							Container: 'opus',
							Context: 'Static',
							MaxAudioChannels: '2',
							Protocol: 'http',
							Type: 'Audio'
						},
						{
							AudioCodec: 'mp3',
							Container: 'mp3',
							Context: 'Static',
							MaxAudioChannels: '2',
							Protocol: 'http',
							Type: 'Audio'
						},
						{
							AudioCodec: 'aac',
							Container: 'aac',
							Context: 'Static',
							MaxAudioChannels: '2',
							Protocol: 'http',
							Type: 'Audio'
						},
						{
							AudioCodec: 'wav',
							Container: 'wav',
							Context: 'Static',
							MaxAudioChannels: '2',
							Protocol: 'http',
							Type: 'Audio'
						},
						{
							AudioCodec: 'aac,mp3',
							BreakOnNonKeyFrames: true,
							Container: 'ts',
							Context: 'Streaming',
							MaxAudioChannels: '2',
							Protocol: 'hls',
							Type: 'Video',
							VideoCodec: 'h264'
						}
					]
				}
			}
		}).then((r) => r.data?.MediaSources?.[0]?.TranscodingUrl)
	);
