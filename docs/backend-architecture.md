# Backend architecture

This file contains an overview of the most important parts of the backend architecture.

## Request, library and downloads modules

These modules drive the requests, files management and downloads. Requests don't know of downloads or the library, and are only responsible for reacting to users requests and watch status changes, managing which requests are active, and notifying the library of changes. Library matches requests to files on disk, or tells downloads module if a file is missing. It also takes care of disk cleanup and housekeeping.

```mermaid
flowchart LR
  subgraph requests["Requests: what a user wants on disk"]
    RS["RequestsService"]
    RQ[("request")]
    RR[("request_rule")]
    SR[("selected_release")]
  end

  subgraph library["Library: the hub"]
    FS["FulfilmentService"]
    IS["ImportService"]
    LS["LibraryService"]
    DEL["DeletionService"]
    STS["StatusService"]
    RB[("request_binding")]
    MF[("media_file")]
  end

  subgraph downloads["Downloads: torrents and what is wanted of them"]
    DS["DownloadsService"]
    TR["TorrentRuntime"]
    T[("torrent")]
    TI[("torrent_item")]
  end

  RS -.->|"library.reconcileRequest<br/>{requestId}"| FS
  FS -->|"readRequest<br/>findSelectedReleases<br/>deleteRequests"| RS
  FS -->|"ensureTorrent<br/>requestItem<br/>releaseItem"| DS
  DS -.->|"library.importItem<br/>{infoHash, itemId}"| FS
```

## Request creation to fulfillment overview

The sequence of a request that goes well, from a user picking a release to the file playing: solid arrows are calls, dashed arrows are the jobs that carry the events between the modules, named by their type.

```mermaid
sequenceDiagram
  actor User
  participant Requests
  participant Library
  participant Downloads
  participant Engine as Torrent engine

  User->>Requests: requests an episode, picks a release for its season
  Requests->>Requests: resolves the release into selected_release, applies the rules, the request is needed
  Requests-->>Library: library.reconcileRequest {requestId}
  Library->>Requests: readRequest, findSelectedReleases
  Library->>Downloads: ensureTorrent, requestItem
  Library->>Library: binds the request to the item
  Downloads-->>Downloads: downloads.reconcileTorrent {infoHash}
  Downloads->>Engine: start
  Engine-->>Downloads: downloads.reconcileTorrent, the files are known
  Downloads->>Downloads: matches the item to its file
  Downloads->>Engine: setWantedFiles
  Engine-->>Downloads: downloads.reconcileTorrent, the file is complete
  Downloads->>Downloads: stamps the item complete
  Downloads-->>Library: library.importItem {infoHash, itemId}
  Library->>Downloads: getItemFile
  Library->>Library: imports the file, hard link else copy, as a managed version, and binds the request to it
  Library->>Downloads: releaseItem
  Downloads-->>Downloads: downloads.reconcileTorrent {infoHash}
  Downloads->>Engine: seeds up to the ratio, then stops and deletes the data
  User->>Library: plays the file
```

## The request lifecycle

The life of a request row, from a user's wish to its deletion: a request is inactive until it's approved and passes gates, such as user has picked a source and the episode is needed.

```mermaid
stateDiagram-v2
  state "Waiting for approval" as waiting
  state "No preference (no source)" as nopref
  state "Deleted, the row is gone" as deleted

  [*] --> waiting: a user requests an episode
  [*] --> Approved: an admin requests an episode
  waiting --> Approved: an admin approves, one-way
  waiting --> deleted: unrequested

  state Approved {
    [*] --> nopref
    nopref --> Ahead: a release or a file is picked, outside the download-ahead window (not needed yet)
    nopref --> Active: a release or a file is picked, within the window
    Ahead --> Active: the window reaches it (needed, one-way)
    Active --> nopref: the preference is cleared, unless the request has its file

    state Active {
      state "No file in torrent" as nofile

      [*] --> Resolving
      Resolving --> Downloading: the torrent has a file for the episode
      Resolving --> nofile: the torrent has no file for it
      Resolving --> Failed: the torrent failed, or the preferred file is not in the library
      Resolving --> Available: its file is in the library already
      Downloading --> Available: imported into the library
      nofile --> Resolving: another release is picked
      Failed --> Resolving: the release is picked again, or another one
      Available --> Resolving: its file is forgotten by a scan (deleted externally)
    }
  }

  Approved --> deleted: watched, and no keep setting retains it
  Approved --> deleted: unrequested, or its file is deleted by an admin
  deleted --> [*]
```

## The torrent lifecycle

The lifecycle of a torrent in downloads, from the library ensuring it for a selected release until its data goes: the reconcile job decides every transition from what is wanted of the torrent, what the engine reports and the seed ratio, and the row, keyed by info hash, stays until no item refers to it.

```mermaid
stateDiagram-v2
  state "Idle, no data" as idle
  state "Stopped, with data" as stopped

  [*] --> idle: the library ensures the torrent of a selected release
  idle --> Starting: an item is wanted
  Starting --> Downloading: the engine knows the files, and a wanted item has one
  Starting --> stopped: the files are known, and no wanted item has one
  Downloading --> stopped: every wanted file is complete, the items wait for their import
  Downloading --> Seeding: every item is released (imported, or let go), and the ratio is not reached
  stopped --> Seeding: every item is released, but the ratio is not reached
  stopped --> Starting: an item is wanted again
  stopped --> idle: every item is released, and seeding is done, so its data is deleted
  Seeding --> Downloading: an item is wanted again
  Seeding --> idle: the seed ratio is reached, so its data is deleted
  Starting --> Failed: the engine refuses the source, or reports an error
  Downloading --> Failed: the engine reports an error
  Seeding --> Failed: the engine reports an error
  Failed --> Starting: the library ensures it again, when the release is picked again or a request of it becomes active again
  Failed --> idle: nothing wants it any more, so its data is deleted
  idle --> [*]: purged at night, when no item refers to it
```

## The library file lifecycle

The lifecycle of a file in the library's index, from a scan finding it or an import placing it until its row is deleted: a file a scan found is external and never the server's to delete, an imported file is managed and stays as long as a request holds it, after which the cleanup deletes it.

```mermaid
stateDiagram-v2
  state "External" as external
  state "Gone, the row is deleted" as gone
  state "Managed" as managed {
    state "Held by a request" as held
    state "Unretained" as unretained
    unretained --> held: a request is bound to it, as the version of its torrent, as a preferred file, or from the server page
    held --> unretained: the last request that had it is deleted
  }

  [*] --> external: a scan finds a video file in a library folder
  [*] --> held: imported from a torrent for the requests that wanted it, as a version named after the torrent
  external --> held: an admin marks it managed, and a request has it
  external --> unretained: an admin marks it managed, and no request has it
  managed --> external: an admin marks it external
  unretained --> external: the cleanup finds it changed since its import, or outside the library folders, and keeps it
  unretained --> gone: the cleanup deletes it, on a cleanup day or when an admin runs it
  managed --> gone: an admin deletes it with the requests that have it, or a scan finds it gone and forgets it, so that its requests download it again
  external --> gone: an admin deletes it, or a scan finds it gone and forgets it
  gone --> [*]
```
