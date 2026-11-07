<!-- DEVELOPER MAINTAINED, DO NOT TOUCH -->

# User guide

- [Requesting](#requesting)
  - [Request statuses](#request-statuses)
  - [Automatic requests management](#automatic-requests-management)
  - [Quotas and disk usage limit](#quotas-and-disk-usage-limit)
- [Library folders](#library-folders)
  - [Folder and file structure](#folder-and-file-structure)
  - [Managed files and garbage collection](#managed-files-and-garbage-collection)
- [Downloads](#downloads)
  - [Indexer](#indexer)
  - [Seeding ratio](#seeding-ratio)
  - [Downloading subtitles](#downloading-subtitles)

## Requesting

Requests are the main way to download content in Reiverr. They allow for media and disk space management to be completely automated by counting how many users are requesting a file to be available on the disk and deleting files after no one needs them.

To download media, you need to:

- Configure an indexer ([see indexer section](#indexer))
- Configure a library folder
- Request an episode or movie
- Select a source for the request

### Request statuses

The following statuses can be seen in the requests page or under each episode:

- `Fulfilled`: the request has been fulfilled from the selected source.
- `Starting`: the requests download hasn't begun yet.
- `Downloading`: the file is downloading.
- `Stalled`: the download has no peers.
- `Importing`: the download has finished and the file is being placed in the library.
- `No source`: a source needs to be selected for the request.
- `Not needed`: request is inactive due to "Download ahead" rule, see [automatic requests management](#automatic-requests-management)

Errors:

- `Download failed`: the torrent client encountered an error.
- `Not in torrent`: the episode or movie file could not be found in the selected torrent.
- `Import failed`: the file could not be placed in the library folder.
- `File missing`: request held a file that is no longer on disk. This usually happens if you delete the file externally.
- `Over quota`: your quota is full and request could not be fulfilled. The request will retry atuomatically when you have enough quota.
- `Disk full`: a disk has reached the disk usage limit, so nothing new is downloaded for anyone. The request is automatically retried as well.

<!-- - `Wrong file`: the selected file is not of this episode or movie. -->

Additional statuses:

- `On disk`: shown when an episode or a movie is not requested by you but has a file available on the disk.
- `Deleted in 5h`: an episode or a movie has a file that will be garbage collected. See the `requests page > source` for the specific file.

### Automatic requests management

To automatically download and delete content as you have watched it, three options exist for series:

- **Download ahead** all/1/2/3 episodes
- **Keep last** off/1/2/3 watched episodes
- **Keep watched for** off/1d/1w/1mo

And one for movies:

- **Keep watched for** off/1d/1w/1mo

If both keep last and keep watched for are configured, episode is only unrequested when neither retains it. The download ahead option marks requests as `Not needed`, but it only prevents new downloads from starting. If a download has started or the request has already been fulfilled, nothing will be deleted.

### Quotas and disk usage limit

- Quotas can be configured for each user and limit how much disk space their requests can **retain**.
- This means that if a user unrequests an episode, the file will remain on disk until the next cleanup period, but the user quota is released immediately since the user doesn't retain the file anymore.
- Quota is only checked when the user requests something. Exceeding the quota will not unrequest or delete anything (for example admin lowering users quota below current usage).

## Library folders

Library folders are configurable folders where downloads imported to and external files are found.

- Library folders can be configured in `Settings > Server > Library`
- A **primary library folder** (one for series and movies each) is where downloaded media is imported to. Other library folders will still discover new media.
- Existing and manually added video files are marked as `external` in the server file browser page and will not be cleaned up by Reiverr.

### Folder and file structure

Sonarr, Radarr and Jellyfin libraries should be compatible. New series and movies folders follow the pattern `TITLE (YEAR) [tmdbid-ID]/`, where year and tmdbid are optional.

Video files will be discovered recursively up to 2 folders deep under a series or a movie folder. Many users can request different versions of an episode or a movie, therefore Reiverr adds a "tag" at the end of file names based on the torrent's hash, like below:

`Series Name - S02E10 - TORRENT_HASH_AS_TAG.mkv`

Sidecar subtitles (`.srt`, `.vtt`) are found next to a video with the same name, optionally followed by tags such as the language (`.en.srt`).

An example of a valid folder structure and video name variants:

```
movies/
  Dune (2021) [tmdbid-438631]/
    Dune (2021) - 3f9c2a1b.mkv
    Dune (2021) - 3f9c2a1b.en.srt
  The Matrix (1999)/
    The.Matrix.1999.2160p.BluRay.mkv
series/
  Breaking Bad (2008) [tmdbid-1396]/
    Season 1/
      Breaking Bad - S01E01 - 7d04e6c2.mkv
      Breaking Bad - S01E01 - b81f5a9e.mkv
      Breaking Bad - S01E02-E03 - 7d04e6c2.mkv
  La Casa de Papel/
    la.casa.de.papel.1x04.mp4
```

### Managed files and garbage collection

All files that Reiverr downloads are marked as `managed` (as opposed to `external`), and are subject to automatic garbage collection. Reiverr keeps track of how many people are requesting a file, and once no one retains a file, it is deleted via a garbage collection job at 4 AM (daily by default, configurable in `Settings > Server > Library`).

## Downloads

Reiverr uses [Webtorrent](https://github.com/webtorrent/webtorrent) under the hood to download content.

- if you are using a VPN, it is recommended to put the whole Reiverr container behind it.

### Indexer

To find torrents, Reiverr relies on a Torznab-compatible indexer. You can configure one in `Settings > Server > Downloads > Add indexer`. Only Jackett has been tested so far.

### Seeding ratio

A seeding ratio can be configured in `Settings > Server > Downloads > Seeding ratio`.

- Downloaded torrents will remain in the downloads folder until the seeding ratio has been reached.
- Set to 0 to disable
- Additional UI for managing torrents is planned.

### Downloading subtitles

You can enable automatically grabbing subtitles from torrents in `Settings > Server > Downloads`. This will try to find subtitle files in the torrent and import them as [subtitle sidecars](#folder-and-file-structure).
