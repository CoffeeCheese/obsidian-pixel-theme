import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  readFixtureCatalog,
  validateFixtureCatalog,
} from "../h5/fixture-catalog.mjs";

const catalogUrl = new URL("../h5/fixtures.v1.json", import.meta.url);

async function rawCatalog() {
  return JSON.parse(await readFile(catalogUrl, "utf8"));
}

function copy(value) {
  return structuredClone(value);
}

test("versioned H5 catalog defines the exact ten-view review matrix", async () => {
  const catalog = await readFixtureCatalog(catalogUrl);

  assert.equal(catalog.schemaVersion, 1);
  assert.equal(catalog.fixtureVersion, "1.0.0");
  assert.equal(catalog.rubricVersion, "1.0.0");
  assert.equal(catalog.requiredObsidianVersion, "1.12.7");
  assert.equal(catalog.fixtures.length, 10);

  const matrix = catalog.fixtures.map(
    ({ caseId, theme, viewport }) =>
      `${caseId}:${theme}:${viewport.width}x${viewport.height}`,
  );
  assert.deepEqual(matrix, [
    "canonical-single-markdown:light:1440x1000",
    "canonical-single-markdown:dark:1440x1000",
    "canonical-mixed-tabs:light:1440x1000",
    "canonical-mixed-tabs:dark:1440x1000",
    "canonical-split-units:light:1440x1000",
    "canonical-split-units:dark:1440x1000",
    "canonical-empty-tab:light:1440x1000",
    "canonical-empty-tab:dark:1440x1000",
    "narrow-mixed-stress:light:1024x800",
    "narrow-mixed-stress:dark:1024x800",
  ]);
});

test("every H5 fixture pins native views, topology, content, and transitions", async () => {
  const catalog = await readFixtureCatalog(catalogUrl);

  assert.deepEqual(catalog.transitions, [
    "create",
    "switch",
    "close",
    "reorder",
    "split",
    "merge",
  ]);

  for (const fixture of catalog.fixtures) {
    assert.match(fixture.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(fixture.rubricVersion, catalog.rubricVersion);
    assert.ok(fixture.nativeViewTypes.includes("file-explorer"));
    assert.deepEqual(fixture.topology.rightBanks, ["properties", "outline"]);
    assert.equal(fixture.topology.workspaceModel, "d1-desktop");
    assert.equal(fixture.topology.leftDockVisible, true);
    assert.equal(fixture.topology.nativeActionsVisible, true);
    assert.ok(fixture.requiredContentIds.length > 0);
    assert.ok(fixture.topology.rootGroups.length > 0);
    for (const group of fixture.topology.rootGroups) {
      assert.ok(["reading", "default", "new-tab"].includes(group.activeViewState));
      assert.ok(["reader", "specialized", "neutral"].includes(group.activeContentTier));
    }
  }

  const split = catalog.fixtures.find(
    (fixture) => fixture.id === "canonical-split-units-light",
  );
  assert.equal(split.topology.rootArrangement, "side-by-side");
  assert.deepEqual(
    split.topology.rootGroups.map((group) => group.activeContentTier),
    ["reader", "specialized"],
  );

  const narrow = catalog.fixtures.find(
    (fixture) => fixture.id === "narrow-mixed-stress-light",
  );
  assert.equal(narrow.topology.tabRail, "overflow-stress");
  assert.equal(narrow.topology.edgeFoldExpected, true);

  const caseTabs = new Map([
    ["canonical-single-markdown", [["markdown"]]],
    ["canonical-mixed-tabs", [["markdown", "graph", "canvas"]]],
    ["canonical-split-units", [["markdown"], ["graph"]]],
    ["canonical-empty-tab", [["empty"]]],
    ["narrow-mixed-stress", [["markdown", "graph", "canvas"]]],
  ]);
  for (const fixture of catalog.fixtures) {
    assert.deepEqual(
      fixture.topology.rootGroups.map((group) => group.tabs),
      caseTabs.get(fixture.caseId),
    );
  }
});

test("fixture catalog rejects missing and duplicate definitions", async () => {
  const catalog = await rawCatalog();

  const missingField = copy(catalog);
  delete missingField.fixtures[0].viewport;
  assert.throws(
    () => validateFixtureCatalog(missingField),
    /fixtures\[0\] is missing viewport/,
  );

  const duplicateId = copy(catalog);
  duplicateId.fixtures[1].id = duplicateId.fixtures[0].id;
  assert.throws(
    () => validateFixtureCatalog(duplicateId),
    /fixture id canonical-single-markdown-light is duplicated/,
  );

  const duplicateCase = copy(catalog);
  duplicateCase.fixtures[1].theme = "light";
  assert.throws(
    () => validateFixtureCatalog(duplicateCase),
    /fixture case canonical-single-markdown:light is duplicated/,
  );
});

test("fixture catalog fails closed on malformed versions, topology, and content", async () => {
  const catalog = await rawCatalog();
  const invalidCatalogs = [
    [
      "unknown top-level fields",
      (candidate) => {
        candidate.similarityThreshold = 0.9;
      },
      /fixture catalog contains unknown field similarityThreshold/,
    ],
    [
      "invalid versions",
      (candidate) => {
        candidate.fixtureVersion = "latest";
      },
      /fixtureVersion must use exact x\.y\.z SemVer/,
    ],
    [
      "fixture rubric mismatch",
      (candidate) => {
        candidate.fixtures[0].rubricVersion = "2.0.0";
      },
      /fixtures\[0\]\.rubricVersion must match catalog rubricVersion/,
    ],
    [
      "unknown themes",
      (candidate) => {
        candidate.fixtures[0].theme = "sepia";
      },
      /fixtures\[0\]\.theme must be light or dark/,
    ],
    [
      "unknown H5 cases",
      (candidate) => {
        for (const fixture of candidate.fixtures.slice(0, 2)) {
          fixture.caseId = "canonical-invented";
          fixture.id = `canonical-invented-${fixture.theme}`;
        }
      },
      /fixtures\[0\]\.caseId canonical-invented is not an H5 schema v1 case/,
    ],
    [
      "invalid viewports",
      (candidate) => {
        candidate.fixtures[0].viewport.width = "1440";
      },
      /fixtures\[0\]\.viewport\.width must be a positive integer/,
    ],
    [
      "wrong canonical dimensions",
      (candidate) => {
        candidate.fixtures[0].viewport.width = 1400;
        candidate.fixtures[1].viewport.width = 1400;
      },
      /fixtures\[0\]\.viewport must equal 1440, 1000/,
    ],
    [
      "duplicate native views",
      (candidate) => {
        candidate.fixtures[0].nativeViewTypes.push("markdown");
      },
      /fixtures\[0\]\.nativeViewTypes contains duplicate markdown/,
    ],
    [
      "active view outside its tab group",
      (candidate) => {
        candidate.fixtures[0].topology.rootGroups[0].activeViewType = "graph";
      },
      /activeViewType graph must occur in tabs/,
    ],
    [
      "missing content identifiers",
      (candidate) => {
        candidate.fixtures[0].requiredContentIds = [];
      },
      /fixtures\[0\]\.requiredContentIds must be a non-empty array/,
    ],
    [
      "unexpected content identifiers",
      (candidate) => {
        candidate.fixtures[1].requiredContentIds.push("dark-only-content");
      },
      /fixtures\[1\]\.requiredContentIds must equal h5-reader-bilingual, h5-file-tree/,
    ],
    [
      "case topology mismatch",
      (candidate) => {
        for (const fixture of candidate.fixtures.slice(0, 2)) {
          fixture.nativeViewTypes = [
            "file-explorer",
            "graph",
            "properties",
            "outline",
          ];
          fixture.topology.rootGroups[0] = {
            activeViewType: "graph",
            activeViewState: "default",
            activeContentTier: "specialized",
            tabs: ["graph"],
          };
          fixture.requiredContentIds = ["h5-graph", "h5-file-tree"];
        }
      },
      /fixtures\[0\]\.topology\.rootGroups\[0\]\.tabs must equal markdown/,
    ],
  ];

  for (const [label, mutate, expected] of invalidCatalogs) {
    const candidate = copy(catalog);
    mutate(candidate);
    assert.throws(
      () => validateFixtureCatalog(candidate),
      expected,
      `must reject ${label}`,
    );
  }
});
