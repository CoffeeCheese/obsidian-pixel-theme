import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

const ownershipFileName = ".pixel-h5-run.json";

export const H5_RUN_CAPABILITIES = Object.freeze([
  "snapshot-workspace",
  "install-package",
  "establish-fixture",
  "verify-topology",
  "exercise-transitions",
  "capture-evidence",
  "restore-workspace",
]);

const adapterMethods = [
  "preflight",
  "snapshotWorkspace",
  "installPackage",
  "establishFixture",
  "verifyFixture",
  "exerciseTransitions",
  "captureEvidence",
  "restoreWorkspace",
];

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
}

function assertExactValue(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} must be ${expected}; received ${String(actual)}`);
  }
}

function assertStringArrayIncludes(actual, expected, label) {
  if (!Array.isArray(actual)) {
    throw new TypeError(`${label} must be an array`);
  }
  const missing = expected.filter((item) => !actual.includes(item));
  if (missing.length > 0) {
    throw new Error(`${label} is missing ${missing.join(", ")}`);
  }
}

function assertAdapter(adapter) {
  if (adapter === null || typeof adapter !== "object") {
    throw new TypeError("H5 visual runner requires an adapter object");
  }
  const missing = adapterMethods.filter(
    (method) => typeof adapter[method] !== "function",
  );
  if (missing.length > 0) {
    throw new TypeError(`H5 visual adapter is missing ${missing.join(", ")}`);
  }
}

function selectFixtures(catalog, caseFilter, themeFilter) {
  if (!Array.isArray(catalog?.fixtures)) {
    throw new TypeError("H5 fixture catalog must contain fixtures");
  }

  const selected = catalog.fixtures.filter((fixture) => {
    const caseMatches =
      caseFilter === undefined ||
      fixture.caseId === caseFilter ||
      fixture.id === caseFilter;
    const themeMatches = themeFilter === undefined || fixture.theme === themeFilter;
    return caseMatches && themeMatches;
  });

  if (selected.length === 0) {
    const filters = [
      caseFilter && `case=${caseFilter}`,
      themeFilter && `theme=${themeFilter}`,
    ].filter(Boolean);
    throw new Error(`no H5 fixtures match ${filters.join(" and ") || "the request"}`);
  }
  return selected;
}

function assertPreflight(preflight, catalog, packageIdentity, fixtures) {
  if (preflight === null || typeof preflight !== "object") {
    throw new TypeError("adapter preflight must return an object");
  }

  if (preflight.vault?.dedicated !== true) {
    throw new Error("H5 fixture Vault must be dedicated");
  }
  assertNonEmptyString(preflight.vault?.id, "H5 fixture Vault id");
  assertNonEmptyString(preflight.vault?.path, "H5 fixture Vault path");
  if (preflight.profile?.dedicated !== true) {
    throw new Error("H5 Obsidian profile must be dedicated");
  }
  assertNonEmptyString(preflight.profile?.path, "H5 Obsidian profile path");
  assertExactValue(
    preflight.obsidianVersion,
    catalog.requiredObsidianVersion,
    "Obsidian version",
  );
  assertExactValue(
    preflight.activeTheme,
    packageIdentity.themeName,
    "active theme",
  );
  assertExactValue(preflight.platform, "desktop", "Obsidian platform");
  assertExactValue(preflight.zoomFactor, 1, "Obsidian zoom factor");
  assertExactValue(
    preflight.package?.themeCssSha256,
    packageIdentity.themeCssSha256,
    "candidate theme.css SHA-256",
  );
  assertExactValue(
    preflight.package?.manifestSha256,
    packageIdentity.manifestSha256,
    "candidate manifest.json SHA-256",
  );

  const contentIds = [
    ...new Set(fixtures.flatMap((fixture) => fixture.requiredContentIds)),
  ];
  assertStringArrayIncludes(
    preflight.availableContentIds,
    contentIds,
    "fixture content",
  );
  assertStringArrayIncludes(
    preflight.capabilities,
    H5_RUN_CAPABILITIES,
    "adapter capabilities",
  );
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw signal.reason instanceof Error
      ? signal.reason
      : new DOMException("H5 visual run interrupted", "AbortError");
  }
}

function assertFixtureObservation(fixture, observation, phase) {
  if (observation?.fixtureId !== fixture.id) {
    throw new Error(
      `${fixture.id} ${phase} observation must identify the requested fixture`,
    );
  }
  for (const field of [
    "viewport",
    "theme",
    "nativeViewTypes",
    "topology",
    "requiredContentIds",
  ]) {
    if (!isDeepStrictEqual(observation[field], fixture[field])) {
      throw new Error(
        `${fixture.id} ${field} does not match the fixture catalog during ${phase}`,
      );
    }
  }
}

function assertTransitions(fixture, actual, expected) {
  const expectedResults = expected.map((transition) => ({
    transition,
    verified: true,
  }));
  if (!isDeepStrictEqual(actual, expectedResults)) {
    throw new Error(
      `${fixture.id} transitions must independently verify ${expected.join(", ")}`,
    );
  }
}

function assertInstalledPackage(installedPackage, packageIdentity) {
  assertExactValue(
    installedPackage?.themeCssSha256,
    packageIdentity.themeCssSha256,
    "installed theme.css SHA-256",
  );
  assertExactValue(
    installedPackage?.manifestSha256,
    packageIdentity.manifestSha256,
    "installed manifest.json SHA-256",
  );
}

async function createOwnedRunDirectory(tempParent) {
  const resolvedParent = await realpath(tempParent);
  const runDirectory = await mkdtemp(path.join(resolvedParent, "pixel-h5-"));
  const ownershipToken = randomUUID();
  await writeFile(
    path.join(runDirectory, ownershipFileName),
    `${JSON.stringify({ ownershipToken }, null, 2)}\n`,
    { flag: "wx" },
  );
  return { runDirectory, ownershipToken };
}

async function assertEvidenceFile(requestedPath, returnedPath, runDirectory) {
  assertNonEmptyString(returnedPath, "adapter evidence path");
  if (path.resolve(returnedPath) !== path.resolve(requestedPath)) {
    throw new Error("adapter evidence path must equal the runner-owned output path");
  }
  const stat = await lstat(returnedPath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error("adapter evidence must be a regular non-symbolic-link file");
  }
  const relative = path.relative(await realpath(runDirectory), await realpath(returnedPath));
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("adapter evidence must remain inside the runner-owned directory");
  }
}

export async function cleanupOwnedRunDirectory({
  runDirectory,
  ownershipToken,
}) {
  const markerPath = path.join(runDirectory, ownershipFileName);
  let marker;
  try {
    marker = JSON.parse(await readFile(markerPath, "utf8"));
  } catch (error) {
    throw new Error("refusing to clean H5 run directory without an ownership token", {
      cause: error,
    });
  }
  if (marker.ownershipToken !== ownershipToken) {
    throw new Error("refusing to clean H5 run directory with a mismatched ownership token");
  }
  await rm(runDirectory, { recursive: true });
}

export async function readPackageIdentity({ themePath, manifestPath }) {
  const [themeCss, manifestBytes] = await Promise.all([
    readFile(themePath),
    readFile(manifestPath),
  ]);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  return {
    themeName: manifest.name,
    themeVersion: manifest.version,
    themeCssSha256: createHash("sha256").update(themeCss).digest("hex"),
    manifestSha256: createHash("sha256").update(manifestBytes).digest("hex"),
  };
}

export async function runVisualH5({
  adapter,
  catalog,
  packageIdentity,
  caseFilter,
  themeFilter,
  keepTemp = false,
  tempParent = tmpdir(),
  signal,
  onEvent = () => {},
}) {
  assertAdapter(adapter);
  const selectedFixtures = selectFixtures(catalog, caseFilter, themeFilter);
  const preflight = await adapter.preflight({
    catalog,
    fixtures: selectedFixtures,
    packageIdentity,
    signal,
  });
  assertPreflight(preflight, catalog, packageIdentity, selectedFixtures);
  throwIfAborted(signal);

  let snapshot;
  let ownedRun;
  let primaryError;
  const lifecycleErrors = [];

  try {
    snapshot = await adapter.snapshotWorkspace({ signal });
    throwIfAborted(signal);
    ownedRun = await createOwnedRunDirectory(tempParent);
    await onEvent({ type: "run-directory", path: ownedRun.runDirectory });
    const installedPackage = await adapter.installPackage({
      packageIdentity,
      runDirectory: ownedRun.runDirectory,
      signal,
    });
    assertInstalledPackage(installedPackage, packageIdentity);
    throwIfAborted(signal);

    for (const fixture of selectedFixtures) {
      throwIfAborted(signal);
      await adapter.establishFixture({
        fixture,
        runDirectory: ownedRun.runDirectory,
        signal,
      });
      throwIfAborted(signal);

      const established = await adapter.verifyFixture({
        fixture,
        phase: "established",
        signal,
      });
      assertFixtureObservation(fixture, established, "established");

      const exercised = await adapter.exerciseTransitions({
        fixture,
        transitions: catalog.transitions,
        signal,
      });
      assertTransitions(fixture, exercised, catalog.transitions);
      throwIfAborted(signal);

      const postTransitions = await adapter.verifyFixture({
        fixture,
        phase: "post-transitions",
        signal,
      });
      assertFixtureObservation(fixture, postTransitions, "post-transitions");

      const outputPath = path.join(ownedRun.runDirectory, `${fixture.id}.png`);
      const evidencePath = await adapter.captureEvidence({
        fixture,
        outputPath,
        signal,
      });
      await assertEvidenceFile(outputPath, evidencePath, ownedRun.runDirectory);
      await onEvent({ type: "fixture-captured", fixtureId: fixture.id });
    }
  } catch (error) {
    primaryError = error;
  } finally {
    if (snapshot !== undefined) {
      try {
        await adapter.restoreWorkspace(snapshot, { signal: undefined });
      } catch (error) {
        lifecycleErrors.push(
          new Error(`failed to restore the original H5 review workspace: ${error.message}`, {
            cause: error,
          }),
        );
      }
    }
    if (ownedRun && !keepTemp) {
      try {
        await cleanupOwnedRunDirectory(ownedRun);
      } catch (error) {
        lifecycleErrors.push(error);
      }
    }
  }

  if (primaryError && lifecycleErrors.length === 0) throw primaryError;
  if (primaryError || lifecycleErrors.length > 0) {
    const errors = [primaryError, ...lifecycleErrors].filter(Boolean);
    throw new AggregateError(
      errors,
      `H5 visual run failed: ${errors.map((error) => error.message).join("; ")}`,
      { cause: primaryError },
    );
  }

  return {
    fixtureIds: selectedFixtures.map(({ id }) => id),
    preflight,
    ...(keepTemp ? { runDirectory: ownedRun.runDirectory } : {}),
  };
}
