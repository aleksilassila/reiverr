export function formatSize(size: number) {
  const gbs = size / 1024 / 1024 / 1024;
  const mbs = size / 1024 / 1024;

  if (gbs >= 1) {
    return `${gbs.toFixed(2)} GB`;
  } else {
    return `${mbs.toFixed(2)} MB`;
  }
}

export function formatBitrate(bitrate: number) {
  if (bitrate > 1_000_000) {
    const mbps = bitrate / 1_000_000;
    return `${mbps.toFixed(2)} Mbps`;
  } else {
    const kbps = bitrate / 1_000;
    return `${kbps.toFixed(2)} Kbps`;
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

export function getClosestBitrate(
  qualities: { bitrate: number }[],

  bitrate: number,
) {
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

export const URL_REGEX =
  'https?://(www.)?[-a-zA-Z0-9@:%._+~#=]{1,256}.[a-zA-Z0-9()]{1,6}([-a-zA-Z0-9()@:%_+.~#?&//=]*)';

export const videoExtensions = [
  '.mp4',
  '.mkv',
  '.avi',
  '.webm',
  '.mov',
  '.flv',
  '.wmv',
  '.m4v',
];

export const subtitleExtensions = ['.srt', '.vtt'];

export function getContentType(extension: string): string | undefined {
  switch (extension) {
    case 'mp4':
      return 'video/mp4';
    case 'mkv':
      return 'video/x-matroska';
    case 'srt':
      return 'text/vtt';
    case 'vtt':
      return 'text/vtt';
  }

  console.log('unknown extension', extension);
}

export function srt2webvtt(data: string) {
  // remove dos newlines
  let srt = data.replace(/\r+/g, '');
  // trim white space start and end
  srt = srt.replace(/^\s+|\s+$/g, '');
  // get cues
  const cuelist = srt.split('\n\n');
  let result = '';
  if (cuelist.length > 0) {
    result += 'WEBVTT\n\n';
    for (let i = 0; i < cuelist.length; i = i + 1) {
      result += convertSrtCue(cuelist[i]);
    }
  }
  return result;
}
function convertSrtCue(caption: string) {
  // remove all html tags for security reasons
  //srt = srt.replace(/<[a-zA-Z\/][^>]*>/g, '');
  let cue = '';
  const s = caption.split(/\n/);
  // concatenate muilt-line string separated in array into one
  while (s.length > 3) {
    for (let i = 3; i < s.length; i++) {
      s[2] += '\n' + s[i];
    }
    s.splice(3, s.length - 3);
  }
  let line = 0;
  // detect identifier
  if (!s[0].match(/\d+:\d+:\d+/) && s[1].match(/\d+:\d+:\d+/)) {
    cue += s[0].match(/\w+/) + '\n';
    line += 1;
  }
  // get time strings
  if (s[line].match(/\d+:\d+:\d+/)) {
    // convert time string
    const m = s[1].match(
      /(\d+):(\d+):(\d+)(?:,(\d+))?\s*--?>\s*(\d+):(\d+):(\d+)(?:,(\d+))?/,
    );
    if (m) {
      cue +=
        m[1] +
        ':' +
        m[2] +
        ':' +
        m[3] +
        '.' +
        m[4] +
        ' --> ' +
        m[5] +
        ':' +
        m[6] +
        ':' +
        m[7] +
        '.' +
        m[8] +
        '\n';
      line += 1;
    } else {
      // Unrecognized timestring
      return '';
    }
  } else {
    // file format error or comment lines
    return '';
  }
  // get cue text
  if (s[line]) {
    cue += s[line] + '\n\n';
  }
  return cue;
}
