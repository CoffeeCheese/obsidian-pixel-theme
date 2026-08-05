import assert from "node:assert/strict";
import {
  access,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  H5_RUN_CAPABILITIES,
  cleanupOwnedRunDirectory,
  runVisualH5 as runVisualH5Implementation,
} from "../h5/visual-runner.mjs";

const objectiveContractResults = [
  { check: "repository-contracts", result: "Pass" },
];

function runVisualH5(options) {
  return runVisualH5Implementation({
    objectiveContractResults,
    ...options,
  });
}

const packageIdentity = {
  themeName: "Pixel",
  themeVersion: "0.1.0",
  themeCssSha256: "a".repeat(64),
  manifestSha256: "b".repeat(64),
};

const fixtures = [
  {
    id: "canonical-single-markdown-light",
    caseId: "canonical-single-markdown",
    rubricVersion: "1.0.0",
    viewport: { width: 1440, height: 1000 },
    theme: "light",
    nativeViewTypes: ["file-explorer", "markdown", "properties", "outline"],
    topology: {
      workspaceModel: "d1-desktop",
      rootArrangement: "single",
      tabRail: "native",
      edgeFoldExpected: false,
      leftDockVisible: true,
      rightBanks: ["properties", "outline"],
      rootGroups: [
        {
          activeViewType: "markdown",
          activeViewState: "reading",
          activeContentTier: "reader",
          tabs: ["markdown"],
        },
      ],
      nativeActionsVisible: true,
    },
    requiredContentIds: ["h5-reader-bilingual", "h5-file-tree"],
  },
  {
    id: "canonical-single-markdown-dark",
    caseId: "canonical-single-markdown",
    rubricVersion: "1.0.0",
    viewport: { width: 1440, height: 1000 },
    theme: "dark",
    nativeViewTypes: ["file-explorer", "markdown", "properties", "outline"],
    topology: {
      workspaceModel: "d1-desktop",
      rootArrangement: "single",
      tabRail: "native",
      edgeFoldExpected: false,
      leftDockVisible: true,
      rightBanks: ["properties", "outline"],
      rootGroups: [
        {
          activeViewType: "markdown",
          activeViewState: "reading",
          activeContentTier: "reader",
          tabs: ["markdown"],
        },
      ],
      nativeActionsVisible: true,
    },
    requiredContentIds: ["h5-reader-bilingual", "h5-file-tree"],
  },
];

const catalog = {
  fixtureVersion: "1.0.0",
  rubricVersion: "1.0.0",
  requiredObsidianVersion: "1.12.7",
  transitions: ["create", "switch", "close", "reorder", "split", "merge"],
  fixtures,
};

function validPreflight() {
  return {
    vault: { id: "fixture-vault", path: "/fixture-vault", dedicated: true },
    profile: { path: "/fixture-profile", dedicated: true },
    obsidianVersion: "1.12.7",
    activeTheme: "Pixel",
    platform: "desktop",
    zoomFactor: 1,
    package: {
      themeCssSha256: packageIdentity.themeCssSha256,
      manifestSha256: packageIdentity.manifestSha256,
    },
    availableContentIds: ["h5-reader-bilingual", "h5-file-tree"],
    capabilities: [...H5_RUN_CAPABILITIES],
  };
}

function observationFor(fixture) {
  const narrow = fixture.topology.edgeFoldExpected;
  return {
    fixtureId: fixture.id,
    viewport: structuredClone(fixture.viewport),
    theme: fixture.theme,
    nativeViewTypes: [...fixture.nativeViewTypes],
    topology: structuredClone(fixture.topology),
    shell: {
      workspace: {
        gridSize: "24px 24px",
        gap: narrow ? "8px" : "12px",
        padding: narrow ? "8px" : "12px",
      },
      ribbon: { shadowOffset: [4, 4], cornerRadii: [0, 0, 0, 0] },
      sideModules: [
        { shadowOffset: [4, 4], cornerRadii: [0, 0, 0, 0] },
        { shadowOffset: [4, 4], cornerRadii: [0, 0, 0, 0] },
      ],
      rootGroups: fixture.topology.rootGroups.map(() => ({
        shadowOffset: [5, 5],
        borderWidths: [4, 4, 4, 4],
        cornerRadii: narrow ? [7, 7, 16, 7] : [9, 9, 22, 9],
      })),
      statusBars: [
        {
          shadowOffset: [3, 3],
          borderWidths: [2, 2, 2, 2],
          cornerRadii: [0, 0, 0, 0],
          insetInlineEnd: 18,
          insetBlockEnd: 14,
        },
      ],
      gridOwnerCount: 1,
      textScale200: {
        rootGroupCount: fixture.topology.rootGroups.length,
        statusBarCount: 1,
        nativeActionsVisible: true,
        documentOverflowFree: true,
      },
      interactionPreservation: {
        resizeHandlesOperable: true,
        collapseControlsVisible: true,
        focusableNativeControlAcceptsFocus: true,
        nativeContentOwnerVisible: true,
        statusItemsOperable: true,
      },
    },
    requiredContentIds: [...fixture.requiredContentIds],
  };
}

function fakeAdapter(events, overrides = {}) {
  return {
    async preflight() {
      events.push("preflight");
      return validPreflight();
    },
    async snapshotWorkspace() {
      events.push("snapshot");
      return { layout: "original" };
    },
    async installPackage() {
      events.push("install-package");
      return {
        themeCssSha256: packageIdentity.themeCssSha256,
        manifestSha256: packageIdentity.manifestSha256,
      };
    },
    async establishFixture({ fixture, runDirectory }) {
      events.push(`establish:${fixture.id}`);
      assert.ok(runDirectory.includes("pixel-h5-"));
    },
    async verifyFixture({ fixture, phase }) {
      events.push(`verify:${phase}:${fixture.id}`);
      return observationFor(fixture);
    },
    async exerciseTransitions({ fixture, transitions }) {
      events.push(`transitions:${fixture.id}`);
      return transitions.map((transition) => ({ transition, verified: true }));
    },
    async captureEvidence({ fixture, outputPath }) {
      events.push(`capture:${fixture.id}`);
      await writeFile(outputPath, fixture.id);
      return outputPath;
    },
    async verifyObjectiveVetoes() {
      events.push("objective-vetoes");
      return [{ check: "error-buffers", result: "Pass" }];
    },
    async restoreWorkspace(snapshot) {
      assert.deepEqual(snapshot, { layout: "original" });
      events.push("restore");
    },
    ...overrides,
  };
}

async function withTempParent(callback) {
  const parent = await mkdtemp(path.join(tmpdir(), "pixel-h5-test-"));
  try {
    return await callback(parent);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
}

async function assertTempParentEmpty(tempParent) {
  assert.deepEqual(await readdir(tempParent), []);
}

test("review-time repository contracts must actually pass before preflight", async () => {
  const events = [];
  await assert.rejects(
    runVisualH5Implementation({
      adapter: fakeAdapter(events),
      catalog,
      packageIdentity,
      objectiveContractResults: [
        { check: "repository-contracts", result: "Fail" },
      ],
    }),
    /review-time objective contracts must report Pass/,
  );
  assert.deepEqual(events, []);
});

test("preflight rejection happens before workspace snapshot or temporary allocation", async () => {
  await withTempParent(async (tempParent) => {
    const events = [];
    const adapter = fakeAdapter(events, {
      async preflight() {
        events.push("preflight");
        return { ...validPreflight(), activeTheme: "Default" };
      },
    });

    await assert.rejects(
      runVisualH5({ adapter, catalog, packageIdentity, tempParent }),
      /active theme must be Pixel/,
    );
    assert.deepEqual(events, ["preflight"]);
    await assertTempParentEmpty(tempParent);
  });
});

test("successful run verifies topology around transitions and restores before cleanup", async () => {
  await withTempParent(async (tempParent) => {
    const events = [];
    const result = await runVisualH5({
      adapter: fakeAdapter(events),
      catalog,
      packageIdentity,
      tempParent,
    });

    assert.deepEqual(result.fixtureIds, fixtures.map(({ id }) => id));
    assert.equal(result.runDirectory, undefined);
    assert.deepEqual(events, [
      "preflight",
      "snapshot",
      "install-package",
      `establish:${fixtures[0].id}`,
      `verify:established:${fixtures[0].id}`,
      `transitions:${fixtures[0].id}`,
      `verify:post-transitions:${fixtures[0].id}`,
      `capture:${fixtures[0].id}`,
      `establish:${fixtures[1].id}`,
      `verify:established:${fixtures[1].id}`,
      `transitions:${fixtures[1].id}`,
      `verify:post-transitions:${fixtures[1].id}`,
      `capture:${fixtures[1].id}`,
      "objective-vetoes",
      "restore",
    ]);
    await assertTempParentEmpty(tempParent);
  });
});

test("transient review bench is available for the human session then removed", async () => {
  await withTempParent(async (tempParent) => {
    const events = [];
    const result = await runVisualH5({
      adapter: fakeAdapter(events),
      catalog,
      packageIdentity,
      tempParent,
      source: {
        commit: "c".repeat(40),
        dirty: false,
        author: "Theme Implementer",
      },
      capturedAt: "2026-08-05T04:00:00.000Z",
      async reviewSession({ benchPath, fixtureIds }) {
        events.push("review-session");
        assert.deepEqual(fixtureIds, fixtures.map(({ id }) => id));
        assert.equal(events.includes("restore"), false);
        const html = await readFile(benchPath, "utf8");
        assert.match(html, /H5 review bench/);
        assert.match(html, /Theme Implementer/);
      },
    });

    assert.deepEqual(result.fixtureIds, fixtures.map(({ id }) => id));
    assert.equal(events.at(-2), "review-session");
    assert.equal(events.at(-1), "restore");
    await assertTempParentEmpty(tempParent);
  });
});

test("captured runtime errors veto the review bench and approval export", async () => {
  await withTempParent(async (tempParent) => {
    const events = [];
    const adapter = fakeAdapter(events, {
      async verifyObjectiveVetoes() {
        events.push("objective-vetoes:failed");
        throw new Error("Obsidian error-level console buffer vetoed H5 approval");
      },
    });

    await assert.rejects(
      runVisualH5({ adapter, catalog, packageIdentity, tempParent }),
      /failed during verify-objective-vetoes.*console buffer vetoed H5 approval/,
    );
    assert.ok(!events.includes("review-session"));
    assert.equal(events.at(-1), "restore");
    await assertTempParentEmpty(tempParent);
  });
});

test("adapter failure restores the snapshot and removes owned transient evidence", async () => {
  await withTempParent(async (tempParent) => {
    const events = [];
    const adapter = fakeAdapter(events, {
      async captureEvidence({ outputPath }) {
        events.push("capture:failed");
        await writeFile(outputPath, "partial");
        throw new Error("adapter capture failed");
      },
    });

    await assert.rejects(
      runVisualH5({ adapter, catalog, packageIdentity, tempParent }),
      /adapter capture failed/,
    );
    assert.equal(events.at(-1), "restore");
    await assertTempParentEmpty(tempParent);
  });
});

test("cancelled human review reports its phase and completed recovery after cleanup", async () => {
  await withTempParent(async (tempParent) => {
    const events = [];
    await assert.rejects(
      runVisualH5({
        adapter: fakeAdapter(events),
        catalog,
        packageIdentity,
        tempParent,
        async reviewSession() {
          throw new Error("visual owner cancelled the review");
        },
      }),
      (error) => {
        assert.match(error.message, /failed during review-bench/);
        assert.match(error.message, /visual owner cancelled the review/);
        assert.match(error.message, /original workspace restored/);
        assert.match(error.message, /temporary review page and images removed/);
        return true;
      },
    );
    assert.equal(events.at(-1), "restore");
    await assertTempParentEmpty(tempParent);
  });
});

test("package installation failure restores before removing the owned run", async () => {
  await withTempParent(async (tempParent) => {
    const events = [];
    const adapter = fakeAdapter(events, {
      async installPackage() {
        events.push("install-package:failed");
        throw new Error("exact package install failed");
      },
    });

    await assert.rejects(
      runVisualH5({ adapter, catalog, packageIdentity, tempParent }),
      /exact package install failed/,
    );
    assert.deepEqual(events, [
      "preflight",
      "snapshot",
      "install-package:failed",
      "restore",
    ]);
    await assertTempParentEmpty(tempParent);
  });
});

test("interruption after snapshot restores and cleans the owned run", async () => {
  await withTempParent(async (tempParent) => {
    const events = [];
    const controller = new AbortController();
    const adapter = fakeAdapter(events, {
      async establishFixture({ fixture }) {
        events.push(`establish:${fixture.id}`);
        controller.abort(new Error("reviewer interrupted the run"));
      },
    });

    await assert.rejects(
      runVisualH5({
        adapter,
        catalog,
        packageIdentity,
        tempParent,
        signal: controller.signal,
      }),
      /reviewer interrupted the run/,
    );
    assert.equal(events.at(-1), "restore");
    await assertTempParentEmpty(tempParent);
  });
});

test("topology mismatch is fatal before evidence capture", async () => {
  await withTempParent(async (tempParent) => {
    const events = [];
    const adapter = fakeAdapter(events, {
      async verifyFixture({ fixture, phase }) {
        events.push(`verify:${phase}:${fixture.id}`);
        const observation = observationFor(fixture);
        observation.topology.rootArrangement = "side-by-side";
        return observation;
      },
    });

    await assert.rejects(
      runVisualH5({ adapter, catalog, packageIdentity, tempParent }),
      /topology does not match the fixture catalog/,
    );
    assert.ok(!events.some((event) => event.startsWith("capture:")));
    assert.equal(events.at(-1), "restore");
  });
});

test("an adapter cannot bypass N1 shell ownership checks", async () => {
  await withTempParent(async (tempParent) => {
    const events = [];
    const adapter = fakeAdapter(events, {
      async verifyFixture({ fixture, phase }) {
        events.push(`verify:${phase}:${fixture.id}`);
        const observation = observationFor(fixture);
        observation.shell.rootGroups[0].shadowOffset = [4, 4];
        return observation;
      },
    });

    await assert.rejects(
      runVisualH5({ adapter, catalog, packageIdentity, tempParent }),
      /Cockpit Unit shadow role/,
    );
    assert.ok(!events.some((event) => event.startsWith("capture:")));
    assert.equal(events.at(-1), "restore");
  });
});

test("transition names without independent observations cannot unlock capture", async () => {
  await withTempParent(async (tempParent) => {
    const events = [];
    const adapter = fakeAdapter(events, {
      async exerciseTransitions({ fixture, transitions }) {
        events.push(`transitions:${fixture.id}`);
        return [...transitions];
      },
    });

    await assert.rejects(
      runVisualH5({ adapter, catalog, packageIdentity, tempParent }),
      /transitions must independently verify/,
    );
    assert.ok(!events.some((event) => event.startsWith("capture:")));
    assert.equal(events.at(-1), "restore");
  });
});

test("case and theme filters retain the full preflight and lifecycle contract", async () => {
  await withTempParent(async (tempParent) => {
    const events = [];
    const result = await runVisualH5({
      adapter: fakeAdapter(events),
      catalog,
      packageIdentity,
      caseFilter: "canonical-single-markdown",
      themeFilter: "dark",
      tempParent,
    });

    assert.deepEqual(result.fixtureIds, [fixtures[1].id]);
    assert.equal(events[0], "preflight");
    assert.equal(events.at(-1), "restore");
  });
});

test("keep-temp retains evidence for diagnosis without skipping verification", async () => {
  await withTempParent(async (tempParent) => {
    const events = [];
    const result = await runVisualH5({
      adapter: fakeAdapter(events),
      catalog,
      packageIdentity,
      caseFilter: fixtures[0].id,
      keepTemp: true,
      tempParent,
    });

    assert.ok(result.runDirectory);
    await access(result.runDirectory);
    assert.equal(
      await readFile(path.join(result.runDirectory, `${fixtures[0].id}.png`), "utf8"),
      fixtures[0].id,
    );
    assert.ok(events.includes(`verify:post-transitions:${fixtures[0].id}`));
  });
});

test("cleanup refuses directories without the runner ownership token", async () => {
  await withTempParent(async (tempParent) => {
    const foreignDirectory = await mkdtemp(path.join(tempParent, "foreign-"));
    await writeFile(path.join(foreignDirectory, "keep.txt"), "user data");

    await assert.rejects(
      cleanupOwnedRunDirectory({
        runDirectory: foreignDirectory,
        ownershipToken: "not-owned",
      }),
      /ownership token/,
    );
    assert.equal(await readFile(path.join(foreignDirectory, "keep.txt"), "utf8"), "user data");
  });
});
