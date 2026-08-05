# H5 visual-runner contract

`npm run visual:h5` is development tooling around the installable Pixel package. It is not production theme behavior and does not add JavaScript to Obsidian.

## Dedicated runtime

The built-in adapter uses Obsidian's official CLI developer commands. The Obsidian app must already be running from a dedicated profile that contains only the Vault ID in `development.json`; Pixel must be active and the profile's per-Vault window state must use zoom level `0`. After preflight, the runner snapshots the currently installed package, atomically installs the exact repository `theme.css` and `manifest.json`, verifies both installed hashes, and restores the prior package with the workspace at lifecycle end.

Fixture bytes are pinned by `fixture-content.v1.json`. A missing file, symlink escape, or SHA-256 mismatch stops the run before the workspace snapshot. The fixture-content version must match `fixtures.v1.json`.

## Transient review bench

Before workspace mutation, the guided command executes the repository's actual Node contract suite; failure vetoes the run rather than being rewritten as a passing fact. After runtime preflight it clears the dedicated Obsidian error and console buffers. Every fixture must then pass package/environment identity, topology, transition, required-control and content checks; after the final capture, both runtime buffers must still be empty.

After every selected fixture is captured and the objective veto check succeeds, the runner builds and opens a self-contained `review.html` inside the owned operating-system temporary directory. The page binds the captured views to the exact `theme.css` and `manifest.json` hashes, source commit/worktree state, fixture and rubric versions, Obsidian version, desktop/zoom state, dedicated Vault/profile, capture time, and the objective results that actually ran.

The default run presents all ten views grouped by canonical/narrow state and native topology. View A and View B can be inspected side by side with synchronized zoom/pan, overlaid at an adjustable opacity, or rendered with the browser's `difference` blend for localization. These are diagnostic views only: the bench does not calculate a percentage, threshold, perceptual measure, or equality result.

The six non-compensatory visual gates each expose only `Pass`, `Revise`, and `Fail`, with repeatable fixture/region findings. H5 Identity is a separate holistic `Approved` or `Rejected` judgment and is never derived from the local gates. All decision controls remain disabled until a named reviewer explicitly claims visual-owner authority; the automation labels, generic implementer placeholders, and displayed source author are rejected as owner names. A `Revise` or `Fail` draft cannot be copied without at least one complete fixture, region, and finding. Automation and source-author identity remain read-only provenance and cannot mark decisions. The optional clipboard draft contains text and identities only; it is not an approval attestation. The separate approval download fails closed unless all objective checks and six gates are `Pass`, H5 Identity is `Approved`, and the clean reviewed commit is signed by the authorized named owner.

Focused fixture/theme runs show the same comparison tools but no gate, owner, H5 Identity, or draft controls. Only an exact full ten-view matrix can record decisions.

The command waits for the reviewer to press Enter before restoring the original workspace and deleting the page, screenshots, overlays, and differences. Cancellation or failure reports the active lifecycle phase plus restoration/cleanup outcome in stderr while still removing visual artifacts by default.

### Manual browser acceptance

For a full run, verify the browser-visible behavior before pressing Enter:

1. Confirm all ten fixture cards appear under canonical/narrow and single/split groups, with the exact identity panel visible.
2. Switch among side-by-side, overlay, and difference localization; confirm overlay opacity appears only in overlay mode and the difference canvas renders.
3. Change zoom and drag the comparison surface; both selected images must retain the same scale and translation.
4. Confirm every decision is disabled, then enter a named visual owner and select the authority checkbox; gate, finding, identity, draft, and approval controls must unlock together.
5. Select `Revise` or `Fail` without a complete localized finding; text export must be rejected with an actionable gate message.
6. Confirm `Revise`, `Fail`, or `H5 Identity: Rejected` cannot download an approval, while six `Pass` results plus `H5 Identity: Approved` download `approval.json` without embedded visual evidence.
7. Run a focused `--case`/`--theme` session and confirm it is explicitly diagnostic-only with no human decision controls.

## Exact-artifact approval

`approval.schema.json` defines the canonical strict JSON record. A valid record binds the generated `theme.css` SHA-256, clean reviewed commit provenance, fixture and rubric versions, exact required Obsidian version, review timestamp, named visual owner, objective results, the six visual gates, H5 Identity, and its named-owner signature. Only the stylesheet hash and the three environment versions determine freshness; a documentation- or test-only commit change does not manufacture a new visual review requirement.

The current record, when one exists, is `h5/approval.json`. Replace that one file only with a newly downloaded record that passes verification; normal Git history is the text-only audit trail for the superseded record. Do not commit captured pages or visual evidence.

```sh
# Ordinary CI semantics: absence is allowed; any present validity claim is verified.
npm run visual:h5 -- --verify-approval

# Tagged draft-release semantics: a current signed approval is mandatory.
npm run visual:h5 -- --verify-approval --require-approval

# Inspect a downloaded candidate before replacing the current record.
npm run visual:h5 -- --verify-approval --require-approval --approval=/path/to/approval.json
```

Verification is desktop-free: it reads the committed build, fixture catalog, and JSON record without opening Obsidian or constructing captures. The tag workflow runs it after the reproducible build/check path and before draft creation.

## Filters and temporary evidence

- `--case=<case-id>` runs both themes for one case.
- `--case=<fixture-id>` runs one exact fixture.
- `--theme=light|dark` filters the selected fixtures by theme.
- `--keep-temp` retains the runner-owned temporary directory for local diagnosis.

Without `--keep-temp`, evidence and the review page are removed after the original workspace has been restored, including on adapter failure, review cancellation, and interruption. Cleanup requires the ownership token written by the runner; it refuses arbitrary directories.

## Adapter seam

`--adapter=<module>` or `PIXEL_H5_ADAPTER=<module>` may select another local adapter. The module exports `createAdapter({ root, env })` and returns these async methods:

- `preflight({ catalog, fixtures, packageIdentity, signal })`
- `snapshotWorkspace({ signal })`
- `installPackage({ packageIdentity, runDirectory, signal })`
- `establishFixture({ fixture, runDirectory, signal })`
- `verifyFixture({ fixture, phase, signal })`
- `exerciseTransitions({ fixture, transitions, signal })`
- `captureEvidence({ fixture, outputPath, signal })`
- `verifyObjectiveVetoes({ signal })`
- `restoreWorkspace(snapshot)`

Preflight must report a dedicated Vault and profile, exact Obsidian/theme/zoom/platform/candidate-package identity, verified content IDs, and every capability declared by `H5_RUN_CAPABILITIES`. `installPackage` must return the installed hashes. `verifyFixture` returns the observed viewport, theme, native views, topology, N1 shell roles, interaction-preservation facts, and content IDs. The runner compares the catalog fields and validates the shell/interaction observation before capture and again after transitions; `exerciseTransitions` must return an independently observed `{ transition, verified: true }` result for every catalog transition. `verifyObjectiveVetoes` runs after all selected captures and must fail on any captured runtime error rather than manufacture a `Pass`. Adapters cannot weaken these checks.
