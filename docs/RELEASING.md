# Pixel release and Obsidian update guide

This document is the long-lived operating procedure for publishing Pixel. `manifest.json` is the authoritative current version, `versions.json` is the permanent compatibility history, and each public GitHub Release is immutable.

## Release channels

- `0.x.y` versions are public beta releases, but they are ordinary GitHub Releases rather than GitHub pre-releases so Obsidian can install and update them normally.
- `1.0.0` marks the stable baseline.
- PATCH fixes defects or makes small visual refinements. MINOR introduces substantial new surfaces, layout changes, or compatibility changes. MAJOR is reserved for a stable-version breaking redesign.

## Compatibility policy

Pixel currently targets Obsidian `1.12.0` or newer. Raise `minAppVersion` only when the theme depends on a newer Obsidian DOM, CSS variable, or interface and the change has corresponding test evidence.

Never remove or rewrite a published entry in `versions.json`. Obsidian uses that history to keep older app versions on the latest compatible Pixel release.

## Prepare a version

Choose the version deliberately, then run:

```sh
npm run release:prepare -- 0.9.1
```

The command:

1. rejects invalid, repeated, or non-increasing versions;
2. updates `manifest.json` and appends `versions.json`;
3. synchronizes the current version in both READMEs;
4. creates `docs/releases/0.9.1.md` and `docs/releases/0.9.1.en.md` without overwriting existing notes;
5. builds the theme and runs the complete local test/check path.

The command never commits, creates a tag, or pushes. Review every changed file and complete both release-note documents manually.

## Write release notes

The two documents contain the same complete information and link to each other:

- `docs/releases/<version>.md` — Chinese
- `docs/releases/<version>.en.md` — English and the source for GitHub Release Notes

Complete the highlights, changes, compatibility, known issues, and release validation sections. Do not mark a manual check as `Pass` unless it was performed against the exact candidate.

The lightweight validation policy is:

- Automated tests: `Pass` after the local locked build/test/check path succeeds.
- Desktop manual check: `Pass` for every release.
- iOS manual check: `Pass` for the initial `0.9.0`, every MINOR or MAJOR, and any layout/mobile/compatibility change. A narrowly scoped PATCH may use `Not required` when its affected surface has received an appropriate manual smoke test.
- Android: `Unverified` until a physical-device validation policy is explicitly adopted.

Verify the completed metadata locally:

```sh
npm run release:verify -- 0.9.1
```

## Commit and tag

Commit the reviewed version files and generated `theme.css`. The release commit and annotated tag must be on `main`.

```sh
git add manifest.json versions.json theme.css README.md README.en.md docs/releases/0.9.1.md docs/releases/0.9.1.en.md
git commit -m "chore(release): prepare 0.9.1"
git tag -a 0.9.1 -m "Pixel 0.9.1"
git push --atomic origin main 0.9.1
```

The atomic push prevents publishing only one of the two required refs. The GitHub workflow additionally verifies that the tag commit belongs to `main` and that the current `main` manifest still declares the tagged version.

## Automated publication

A tag matching `*.*.*` is the only GitHub Actions trigger. The workflow:

1. verifies tag/main/manifest identity;
2. installs the lockfile dependencies with Node.js 24;
3. rebuilds `theme.css` and rejects uncommitted generated differences;
4. runs tests and package checks;
5. validates the bilingual notes and manual checklist;
6. creates GitHub build provenance attestations for `theme.css` and `manifest.json`;
7. creates an internal draft, uploads exactly those two files, verifies the asset names, and immediately publishes a normal latest Release using the English notes.

The workflow's third-party Actions are pinned to full commit SHAs and are upgraded only through an explicit maintenance change.

## Failure and immutability

If CI fails before a Release is public, the tag may be deleted and recreated on a corrected commit. Once the Release is public, its tag and assets must never be moved, deleted, or overwritten.

Fix a public regression forward. For example, restore the safe implementation after a bad `0.9.3` and publish it as `0.9.4`; do not replace `0.9.3`.

## First community-directory submission

The first public version requires one manual registration:

1. Make the GitHub repository public.
2. Publish `0.9.0` and confirm its Release contains `manifest.json` and `theme.css`.
3. Confirm the default branch contains the matching `manifest.json`, `README.md`, `LICENSE`, and the `512×288` `src/assets/screenshots/screenshot.png`.
4. Sign in at [community.obsidian.md](https://community.obsidian.md), link the owning GitHub account, and add the theme.
5. Resolve automated review feedback with a new incremented version and Release rather than altering the public `0.9.0` assets.

After approval, no directory resubmission is needed for routine upgrades. Obsidian reads the current default-branch manifest and downloads the identically tagged GitHub Release. Users on an older Obsidian version are resolved through `versions.json` to the latest compatible Pixel version.
