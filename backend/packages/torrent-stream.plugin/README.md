# Torrent-Stream Plugin

The built-in Torrent-Stream plugin uses Jackett to find torrents and [torrent-stream](https://www.npmjs.com/package/torrent-stream) to direct stream them.

When a torrent is selected, it will be downloaded and seeded until a new download is started by the same Reiverr user, after which it will be deleted. Therefore the required disk space is roughly `max media file size` \* `number of active Reiverr users`.

Currently only supports direct streaming, meaning that your browser has to support the video container and encoding to be able to play content. For the widest compatibility, use Edge, Safari or Samsung TV.

Furthermore, subtitles are only available on torrents that include extenral subtitles as VTT or SRT files.

## Configuration

- `Jackett URL`: Jackett torznab feed URL
- `Jackett API Key`

## Environment variables

- `TORRENT_STREAM_DOWNLOADS`: Path to the downloads folder. Default: `torrent-stream-downloads`
