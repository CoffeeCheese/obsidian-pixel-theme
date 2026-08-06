# Pixel 0.1.0 release-candidate handoff

## Status

- Automated package gate: Pass
- Dedicated `dev-test` Vault deployment: Pass
- Manual desktop acceptance: Pending
- Physical iOS and Android: Pending
- Public publication has **not** been performed

Pixel `0.1.0` is prepared as a local release candidate for tester-operated review. The generated package and automated release contracts pass, but the candidate is not approved for public release until the pending manual gates required by Ticket 13 are recorded. An iOS-only pass approves only that slice while Android remains pending.

## Exact candidate

- Theme version: `0.1.0`
- Minimum Obsidian version: `1.12.0`
- Compatibility map: `versions.json` → `"0.1.0": "1.12.0"`
- Install files: `manifest.json`, `theme.css`
- `theme.css` SHA-256: `1ffdeb8a81e55208f49203878460f3e288feb98f84a57629841cf17d29d4fc97`
- `manifest.json` SHA-256: `fbe28b5a338651b3b318680bb0b450dad4f64cf71ea25672af7c3e599da7d40b`
- Generated CSS: `1,239,095` bytes (limit: 1.5 MiB)
- Encoded font payload: `1,131,736` bytes (limit: 1.2 MiB)
- Runtime network assets: none
- Theme license: MIT; bundled fonts: SIL Open Font License 1.1

The licenses and attribution required to redistribute the theme and its three embedded fonts are preserved inside `theme.css`, so the two-file install package is self-contained.

## Reproducible verification

The candidate was prepared on macOS using Node.js `24.19.0`, npm `11.19.0`, and `package-lock.json`:

```sh
npm ci
npm run build
npm test
npm run check
```

The CI and tag-triggered draft-release workflows run this same sequence. A tagged workflow creates a draft containing only `theme.css` and `manifest.json`; it does not publish to the Obsidian community directory.

## Deployment result

The candidate was deployed through the guarded build path to the configured dedicated `dev-test` Vault. The destination contained only `theme.css` and `manifest.json`, and both installed files matched the repository hashes above byte-for-byte. No personal Vault was targeted.

If the iCloud-backed `dev-test` Vault is available in Obsidian on the paired iPhone, allow Vault configuration/theme files to sync, force-quit and reopen Obsidian when needed, then select Pixel under Appearance. Direct iPhone use and macOS iPhone Mirroring are both described in [DEVICE_TEST_PLAN.md](DEVICE_TEST_PLAN.md); no device result has been pre-filled.

## Pending tester acceptance

Use [DEVICE_TEST_PLAN.md](DEVICE_TEST_PLAN.md) and the ignored matrix at `evidence/ticket-13/devices/MATRIX.md`. At minimum, an iOS-only result needs all eight iPhone/iPad × portrait/landscape × Light/Dark cells. Manual desktop checks and every unexecuted platform remain `Pending`.

Any unreadable content, clipping, overlap, broken scroll, M1/D1 regression, accessibility-floor failure, native interaction regression, remote request, or theme-caused error blocks the relevant approval. A stylesheet change creates a new candidate hash and invalidates evidence recorded against the hash above.

## Known limitations

No automated package limitation is known. Manual desktop and physical-device behavior are deliberately unclaimed because the user will perform those checks. No tag, GitHub release, Obsidian community-directory submission, or other public publication was created by this implementation.
