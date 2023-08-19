/**
 * Returns an array containing all the available
 * qualities the user can select when playing a video
 *
 * @param resolution The resolution of the video
 * @returns An array containing all the available qualities
 */
export function getQualities(resolution: number) {
	// We add one to the minimum resolution since some movies
	// have a resolution of 1080p, but the format isn't 16:9,
	// so the height is less than 1080, so we detect as 1080p
	// anything higher than 720p, and so on for the other.
	const data = [
		{
			name: '4K - 120 Mbps',
			maxBitrate: 120000000,
			minResolution: 1080 + 1
		},
		{
			name: '4K - 80 Mbps',
			maxBitrate: 80000000,
			minResolution: 1080 + 1
		},
		{
			name: '1080p - 40 Mbps',
			maxBitrate: 40000000,
			minResolution: 720 + 1
		},
		{
			name: '1080p - 10 Mbps',
			maxBitrate: 10000000,
			minResolution: 720 + 1
		},
		{
			name: '720p - 8 Mbps',
			maxBitrate: 8000000,
			minResolution: 480 + 1
		},
		{
			name: '720p - 4 Mbps',
			maxBitrate: 4000000,
			minResolution: 480 + 1
		},
		{
			name: '480p - 3 Mbps',
			maxBitrate: 3000000,
			minResolution: 360 + 1
		},
		{
			name: '480p - 720 Kbps',
			maxBitrate: 720000,
			minResolution: 360 + 1
		},
		{
			name: '360p - 420 Kbps',
			maxBitrate: 420000,
			minResolution: 0
		}
	];

	return data.filter((quality) => {
		return quality.minResolution <= resolution;
	});
}
