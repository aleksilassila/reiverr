export const JELLYFIN_DEVICE_ID = 'Reiverr Client';

export function formatSize(size: number) {
  const gbs = size / 1024 / 1024 / 1024;
  const mbs = size / 1024 / 1024;

  if (gbs >= 1) {
    return `${gbs.toFixed(2)} GB`;
  } else {
    return `${mbs.toFixed(2)} MB`;
  }
}

export const bitrateQualities = [
  {
    label: '4K - 120 Mbps',
    bitrate: 120000000,
    codec: undefined,
    original: false,
  },
  {
    label: '4K - 80 Mbps',
    bitrate: 80000000,
    codec: undefined,
    original: false,
  },
  {
    label: '1080p - 40 Mbps',
    bitrate: 40000000,
    codec: undefined,
    original: false,
  },
  {
    label: '1080p - 10 Mbps',
    bitrate: 10000000,
    codec: undefined,
    original: false,
  },
  {
    label: '720p - 8 Mbps',
    bitrate: 8000000,
    codec: undefined,
    original: false,
  },
  {
    label: '720p - 4 Mbps',
    bitrate: 4000000,
    codec: undefined,
    original: false,
  },
  {
    label: '480p - 3 Mbps',
    bitrate: 3000000,
    codec: undefined,
    original: false,
  },
  {
    label: '480p - 720 Kbps',
    bitrate: 720000,
    codec: undefined,
    original: false,
  },
  {
    label: '360p - 420 Kbps',
    bitrate: 420000,
    codec: undefined,
    original: false,
  },
];

export function getClosestBitrate(qualities, bitrate) {
  return qualities.reduce(
    (prev, curr) =>
      Math.abs(curr.bitrate - bitrate) < Math.abs(prev.bitrate - bitrate)
        ? curr
        : prev,
    qualities[0],
  );
}

export function formatTicksToTime(ticks: number) {
  return formatMinutesToTime(ticks / 10_000_000 / 60);
}

export function formatMinutesToTime(minutes: number) {
  const days = Math.floor(minutes / 60 / 24);
  const hours = Math.floor((minutes / 60) % 24);
  const minutesLeft = Math.floor(minutes % 60);

  return `${days > 0 ? days + 'd ' : ''}${hours > 0 ? hours + 'h ' : ''}${
    days > 0 ? '' : minutesLeft + 'min'
  }`;
}
