# H5 visual-runner contract

`npm run visual:h5` is development tooling around the installable Pixel package. It is not production theme behavior and does not add JavaScript to Obsidian.

## Dedicated runtime

The built-in adapter uses Obsidian's official CLI developer commands. The Obsidian app must already be running from a dedicated profile that contains only the Vault ID in `development.json`; Pixel must be active and the profile's per-Vault window state must use zoom level `0`. After preflight, the runner snapshots the currently installed package, atomically installs the exact repository `theme.css` and `manifest.json`, verifies both installed hashes, and restores the prior package with the workspace at lifecycle end.

Fixture bytes are pinned by `fixture-content.v1.json`. A missing file, symlink escape, or SHA-256 mismatch stops the run before the workspace snapshot. The fixture-content version must match `fixtures.v1.json`.

## Filters and temporary evidence

- `--case=<case-id>` runs both themes for one case.
- `--case=<fixture-id>` runs one exact fixture.
- `--theme=light|dark` filters the selected fixtures by theme.
- `--keep-temp` retains the runner-owned temporary directory for local diagnosis.

Without `--keep-temp`, evidence is removed after the original workspace has been restored, including on adapter failure and interruption. Cleanup requires the ownership token written by the runner; it refuses arbitrary directories.

## Adapter seam

`--adapter=<module>` or `PIXEL_H5_ADAPTER=<module>` may select another local adapter. The module exports `createAdapter({ root, env })` and returns these async methods:

- `preflight({ catalog, fixtures, packageIdentity, signal })`
- `snapshotWorkspace({ signal })`
- `installPackage({ packageIdentity, runDirectory, signal })`
- `establishFixture({ fixture, runDirectory, signal })`
- `verifyFixture({ fixture, phase, signal })`
- `exerciseTransitions({ fixture, transitions, signal })`
- `captureEvidence({ fixture, outputPath, signal })`
- `restoreWorkspace(snapshot)`

Preflight must report a dedicated Vault and profile, exact Obsidian/theme/zoom/platform/candidate-package identity, verified content IDs, and every capability declared by `H5_RUN_CAPABILITIES`. `installPackage` must return the installed hashes. `verifyFixture` returns the observed viewport, theme, native views, topology, and content IDs. The runner compares the observation to the catalog before capture and again after transitions; `exerciseTransitions` must return an independently observed `{ transition, verified: true }` result for every catalog transition. Adapters cannot weaken these checks.
