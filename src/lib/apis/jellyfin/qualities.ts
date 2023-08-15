/**
 * Returns an array containing all the available
 * qualities the user can select when playing a video
 * 
 * @param resolution The resolution of the video
 * @returns An array containing all the available qualities
 */
export function getQualities(resolution : number) {
    let data = [
        {
            name: "4K - 120 Mbps",
            maxBitrate: 120000000,
            minResolution: 2160
        },
        {
            name: "4K - 80 Mbps",
            maxBitrate: 80000000,
            minResolution: 2160
        },
        {
            name: "1080p - 40 Mbps",
            maxBitrate: 40000000,
            minResolution: 1080
        },
        {
            name: "1080p - 10 Mbps",
            maxBitrate: 10000000,
            minResolution: 1080
        },
        {
            name: "720p - 8 Mbps",
            maxBitrate: 8000000,
            minResolution: 720
        },
        {
            name: "720p - 4 Mbps",
            maxBitrate: 4000000,
            minResolution: 720
        },
        {
            name: "480p - 3 Mbps",
            maxBitrate: 3000000,
            minResolution: 480
        },
        {
            name: "480p - 720 Kbps",
            maxBitrate: 720000,
            minResolution: 480
        },
        {
            name: "360p - 420 Kbps",
            maxBitrate: 420000,
            minResolution: 360
        }
    ]

    return data.filter((quality) => {
        return quality.minResolution <= resolution
    });
}