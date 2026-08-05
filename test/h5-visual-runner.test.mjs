import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  H5_RUN_CAPABILITIES,
  cleanupOwnedRunDirectory,
  runVisualH5,
} from "../h5/visual-runner.mjs";

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
    installedPackage: {
      themeCssSha256: packageIdentity.themeCssSha256,
      manifestSha256: packageIdentity.manifestSha256,
    },
    availableContentIds: ["h5-reader-bilingual", "h5-file-tree"],
    capabilities: [...H5_RUN_CAPABILITIES],
  };
}

function observationFor(fixture) {
  return {
    fixtureId: fixture.id,
    viewport: structuredClone(fixture.viewport),
    theme: fixture.theme,
    nativeViewTypes: [...fixture.nativeViewTypes],
    topology: structuredClone(fixture.topology),
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
      return [...transitions];
    },
    async captureEvidence({ fixture, outputPath }) {
      events.push(`capture:${fixture.id}`);
      await writeFile(outputPath, fixture.id);
      return outputPath;
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
    assert.deepEqual(await import("node:fs/promises").then(({ readdir }) => readdir(tempParent)), []);
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
      "restore",
    ]);
    assert.deepEqual(await import("node:fs/promises").then(({ readdir }) => readdir(tempParent)), []);
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
    assert.deepEqual(await import("node:fs/promises").then(({ readdir }) => readdir(tempParent)), []);
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
    assert.deepEqual(await import("node:fs/promises").then(({ readdir }) => readdir(tempParent)), []);
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
