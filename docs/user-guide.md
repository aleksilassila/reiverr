# User guide

<!-- DEVELOPER MAINTAINED, DO NOT TOUCH -->

## Requests

Requests are the main way to download content in Reiverr. They allow for media and disk space management to be completely automated by counting how many users are requesting a file to be available on the disk and deleting files after no one needs them. In order to save disk space and increase catalog size, requests can even be configured to only retain next 1-3 episodes and watched episodes can be automatically unrequested.

### Source selection

A source torrent is what will be downloaded when the request goes active.

- Can be selected separately for each episode
- A season pack can be selected for a whole season, and will be used if an episode doesn't have a source selected separately

### Automatic requests management

To automatically download and delete content as you have watched it, three options exist for series:

- **Download ahead** all/1/2/3 episodes
- **Keep last** off/1/2/3 watched episodes
- **Keep watched for** off/1d/1w/1mo

And one for movies:

- **Keep watched for** off/1d/1w/1mo

If both keep last and keep watched for are configured, episode is only unrequested when neither retains it. The download ahead option marks requests as `not needed yet`, but it only prevents new downloads from starting. If a download has started or the request has already been fulfilled, nothing will be deleted.

### Quotas and disk usage limit

## Library folders

Library folders are where media is discovered from and imported to.

- Library folders can be configured in `Settings > Server > Library`
- A **primary library folder** (one for series and movies each) is where downloaded media is imported to. Other library folders will still discover new media.
- Existing and manually added video files are marked as external and will not be cleaned up by Reiverr.

### Folder and file names

Libraries used with Sonarr, Radarr and Jellyfin should be compatible. Series and movies folders follow the pattern `TITLE (YEAR) [tmdbid-ID]/`, where year and tmdbid are optional.

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

### Indexer

### Seed ratio

### Downloading subtitles
