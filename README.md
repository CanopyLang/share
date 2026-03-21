# canopy/share

Invoke the native OS share sheet to share URLs, text, and files using the Web Share API.

## Installation

```
canopy install canopy/share
```

## Core Concept

The Web Share API delegates sharing to the operating system rather than implementing it in the browser. On mobile this opens the native share sheet; on desktop it typically shows a browser-managed sharing dialog. The result is that users can share to any app the OS knows about — messaging, email, social, notes — without the web application needing to integrate with any of them individually.

A share is initiated by passing a `ShareData` value to `Share.share`. The browser presents the dialog and reports back with `Shared`, `Cancelled`, or `Failed`. Because the user can always dismiss the sheet without sharing, `Cancelled` is a normal outcome, not an error.

## Quick Start

```canopy
import Share exposing (ShareResult(..))


type Msg
    = SharePage
    | ShareCompleted ShareResult


update msg model =
    case msg of
        SharePage ->
            ( model
            , Share.share
                { title = "Check this out"
                , text = Just "An interesting article I found."
                , url = Just "https://example.com/article"
                }
            )

        ShareCompleted Shared ->
            ( { model | status = "Shared successfully" }, Cmd.none )

        ShareCompleted Cancelled ->
            ( model, Cmd.none )

        ShareCompleted (Failed err) ->
            ( { model | status = "Share failed" }, Cmd.none )
```

## API Summary

### Commands

| Function | Type | Description |
|----------|------|-------------|
| `Share.share` | `ShareData -> Cmd msg` | Open the share sheet with title, text, and/or URL. |
| `Share.shareFiles` | `ShareDataWithFiles -> Cmd msg` | Open the share sheet and include files. |
| `Share.shareUrl` | `String -> Cmd msg` | Share a single URL with no title or text. |
| `Share.shareText` | `String -> String -> Cmd msg` | Share a title and body text with no URL. |

### Flags

| Value | Type | Description |
|-------|------|-------------|
| `Share.isAvailable` | `Bool` | Whether the Web Share API is supported in this browser. |
| `Share.canShare` | `ShareData -> Bool` | Whether the browser can share the given data. Use before sharing files. |

### Types

```canopy
type alias ShareData =
    { title : String
    , text : Maybe String
    , url : Maybe String
    }

type alias ShareDataWithFiles =
    { title : String
    , text : Maybe String
    , url : Maybe String
    , files : List File
    }

type ShareResult
    = Shared
    | Cancelled
    | Failed ShareError

type ShareError
    = NotAllowed     -- Secure context missing, or call not from a user gesture.
    | NotSupported   -- The browser does not support the Web Share API.
    | InvalidData    -- The ShareData was rejected as malformed.
    | UnknownError String
```

## Gotchas

**HTTPS required.** The Web Share API is only available in secure contexts. Calls from plain HTTP pages will fail with `NotAllowed`. This includes `file://` URLs.

**User gesture required.** Like other powerful browser APIs, `share` must be called in direct response to a user interaction. Programmatic calls will be rejected.

**File sharing has limited desktop support.** Sharing files via `shareFiles` is well supported on Android and iOS, but desktop browsers have inconsistent or absent support. Always call `canShare` with your `ShareData` before attempting to share files, and provide a fallback if it returns `False`.

**`Cancelled` is not an error.** When the user dismisses the share sheet without sharing, the result is `Cancelled`. Treat this the same as a no-op; do not display an error message to the user.

**At least one field must be present.** `ShareData` requires at least one of `text`, `url`, or `files` to be non-empty. A `ShareData` with only `title` set will be rejected as `InvalidData`.

## License

BSD-3-Clause
