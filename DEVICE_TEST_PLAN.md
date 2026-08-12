# Pixel iOS physical-device release validation

Pixel's M1 implementation is selected by Obsidian's mobile platform structure, not viewport width. Desktop resizing and responsive emulation are useful structural smoke tests, but they do not replace iOS physical-device validation. Android is currently `Unverified`, is not a release gate, and is not part of the project's support claim.

## Candidate setup

1. Build from a clean lockfile install with Node.js 24: `npm ci`, `npm run build`, `npm test`, and `npm run check`.
2. Put only the candidate `manifest.json` and `theme.css` in the test Vault's `.obsidian/themes/Pixel/` directory.
3. In Obsidian Appearance, activate Pixel and record the theme version, Obsidian version, OS version, device class, orientation, and color mode. Do not record a serial number, account, or personal Vault content.
4. Store screenshots, screen recordings, diagnostic logs, and completed notes locally under `evidence/devices/`. That path is intentionally ignored by Git. Record only the summary status in the matching bilingual release notes.

## Tester-operated viewing

You may operate the paired iPhone directly or through macOS iPhone Mirroring. A mirrored session still records the actual iPhone and iOS versions; it is not a desktop responsive-emulation result. If a required orientation, system gesture, keyboard state, or safe-area condition cannot be exercised through mirroring, complete that check directly on the device. No row becomes `Pass` until the tester records it.

## Required matrix

Every iOS cell must have a dated `Pass` or `Fail` record when the release policy requires a complete iOS pass. A tablet remains M1 even at its widest landscape viewport.

| Platform | Hardware | Portrait Light | Portrait Dark | Landscape Light | Landscape Dark |
| --- | --- | --- | --- | --- | --- |
| iOS | Phone | Pending | Pending | Pending | Pending |
| iOS | Tablet | Pending | Pending | Pending | Pending |

Android remains explicitly `Unverified`; do not infer Android support from responsive emulation or the iOS result.

## Checks in every cell

- The note is the persistent base; no mobile size or orientation turns the workspace into desktop D1.
- The native left file drawer and right context drawer open over the note, remain mutually exclusive, and preserve the cyan/amber ownership cues.
- Scrim tap and explicit close dismiss the active drawer. Platform back/navigation dismisses it where the OS exposes that action, returns focus to the note, and does not exit or navigate unexpectedly.
- Notches, rounded corners, status/navigation areas, and the home indicator do not cover headers, the raised navbar, or content.
- Theme-owned primary targets are at least 44×44 CSS px, separated by at least 8px, and remain usable without hover or long press.
- Reading, Source, and Live Preview retain readable text, selection, scrolling, folding, links, callouts, tables, embeds, and media controls.
- With the virtual keyboard visible, the active editor line stays reachable, the native editing toolbar remains usable, and no Pixel surface competes with or covers either one.
- Rotate with a drawer closed and open; M1 ownership, scroll position, and available close paths remain intact.
- No unreadable text, clipped action, destructive overlap, broken scroll region, native interaction regression, theme-caused error, or repeated warning appears.

## Focused interaction passes

Perform these once per iOS hardware class in both Light and Dark:

1. Open a long Markdown fixture, scroll into a callout/table/code section, switch Reading → Live Preview → Source → Reading, and verify document identity and approximate position remain intact.
2. Open the left drawer, select another fixture, use native history to return, and verify the drawer closes and tree state remains usable.
3. Open the right drawer, switch among Properties, Outline, Backlinks, and Outgoing Links, follow one destination, and return to the note.
4. Enter a unique temporary string with the virtual keyboard, use the native toolbar, undo it, close/reopen the note, and confirm the fixture was not unintentionally changed.
5. Enable the OS large-text and reduced-motion preferences available to the device, repeat drawer and edit checks, then restore the settings.
6. Capture mobile diagnostics using the platform-supported method when available. Record zero theme-caused errors; attach any warning to a reproducible step.

## Evidence note template

```md
# Pixel <version> iOS device check

- Date:
- Tester:
- iOS / iPadOS version:
- Device class: phone | tablet
- Obsidian version:
- Orientation: portrait | landscape
- Mode: Light | Dark
- Candidate SHA-256 (theme.css):
- Result: Pass | Fail
- Checks performed:
- Diagnostic result:
- Evidence filenames:
- Defect / reproduction (required on Fail):
```

Any failure involving M1 structure, accessibility, content readability, or native behavior blocks the relevant iOS release check. Fix the theme, rebuild the exact candidate, then repeat every matrix cell whose evidence was tied to the previous stylesheet hash.

## Android status

Android is an unverified platform. It has no required matrix in the current release process, must remain `Unverified` in release notes, and must not be described as supported until an explicit physical-device validation policy is adopted.
