import { readFile } from "node:fs/promises";

const catalogFields = [
  "schemaVersion",
  "fixtureVersion",
  "rubricVersion",
  "requiredObsidianVersion",
  "transitions",
  "fixtures",
];
const fixtureFields = [
  "id",
  "caseId",
  "rubricVersion",
  "viewport",
  "theme",
  "nativeViewTypes",
  "topology",
  "requiredContentIds",
];
const topologyFields = [
  "workspaceModel",
  "rootArrangement",
  "tabRail",
  "edgeFoldExpected",
  "leftDockVisible",
  "rightBanks",
  "rootGroups",
  "nativeActionsVisible",
];
const requiredTransitions = [
  "create",
  "switch",
  "close",
  "reorder",
  "split",
  "merge",
];
const supportedViewTypes = new Set([
  "file-explorer",
  "markdown",
  "properties",
  "outline",
  "graph",
  "canvas",
  "empty",
]);
const requiredCaseTabs = new Map([
  ["canonical-single-markdown", [["markdown"]]],
  ["canonical-mixed-tabs", [["markdown", "graph", "canvas"]]],
  ["canonical-split-units", [["markdown"], ["graph"]]],
  ["canonical-empty-tab", [["empty"]]],
  ["narrow-mixed-stress", [["markdown", "graph", "canvas"]]],
]);
const contentIdByViewType = new Map([
  ["markdown", "h5-reader-bilingual"],
  ["graph", "h5-graph"],
  ["canvas", "h5-canvas"],
]);

function assertObject(value, path) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${path} must be a JSON object`);
  }
}

function assertExactFields(value, fields, path) {
  for (const field of fields) {
    if (!Object.hasOwn(value, field)) {
      throw new TypeError(`${path} is missing ${field}`);
    }
  }

  for (const field of Object.keys(value)) {
    if (!fields.includes(field)) {
      throw new TypeError(`${path} contains unknown field ${field}`);
    }
  }
}

function assertSemver(value, path) {
  if (!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(value)) {
    throw new TypeError(`${path} must use exact x.y.z SemVer`);
  }
}

function assertString(value, path) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${path} must be a non-empty string`);
  }
}

function assertUniqueStringArray(value, path) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(`${path} must be a non-empty array`);
  }

  const seen = new Set();
  for (const item of value) {
    assertString(item, `${path} item`);
    if (seen.has(item)) {
      throw new TypeError(`${path} contains duplicate ${item}`);
    }
    seen.add(item);
  }
}

function assertExactArray(actual, expected, path) {
  if (
    actual.length !== expected.length ||
    actual.some((item, index) => item !== expected[index])
  ) {
    throw new TypeError(`${path} must equal ${expected.join(", ")}`);
  }
}

function validateRootGroup(group, path) {
  assertObject(group, path);
  assertExactFields(
    group,
    ["activeViewType", "activeViewState", "activeContentTier", "tabs"],
    path,
  );
  assertString(group.activeViewType, `${path}.activeViewType`);
  if (!["reading", "default", "new-tab"].includes(group.activeViewState)) {
    throw new TypeError(
      `${path}.activeViewState must be reading, default, or new-tab`,
    );
  }
  if (!["reader", "specialized", "neutral"].includes(group.activeContentTier)) {
    throw new TypeError(
      `${path}.activeContentTier must be reader, specialized, or neutral`,
    );
  }
  assertUniqueStringArray(group.tabs, `${path}.tabs`);
  if (!group.tabs.includes(group.activeViewType)) {
    throw new TypeError(
      `${path}.activeViewType ${group.activeViewType} must occur in tabs`,
    );
  }
  for (const viewType of group.tabs) {
    if (!supportedViewTypes.has(viewType)) {
      throw new TypeError(`${path}.tabs contains unsupported native view ${viewType}`);
    }
  }

  const expectedActiveContract =
    group.activeViewType === "markdown"
      ? ["reading", "reader"]
      : group.activeViewType === "empty"
        ? ["new-tab", "neutral"]
        : ["default", "specialized"];
  assertExactArray(
    [group.activeViewState, group.activeContentTier],
    expectedActiveContract,
    `${path} active view contract`,
  );
}

function validateFixture(fixture, index, rubricVersion) {
  const path = `fixtures[${index}]`;
  assertObject(fixture, path);
  assertExactFields(fixture, fixtureFields, path);
  assertString(fixture.id, `${path}.id`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fixture.id)) {
    throw new TypeError(`${path}.id must be a lowercase kebab-case identifier`);
  }
  assertString(fixture.caseId, `${path}.caseId`);
  if (!requiredCaseTabs.has(fixture.caseId)) {
    throw new TypeError(`${path}.caseId ${fixture.caseId} is not an H5 schema v1 case`);
  }
  assertSemver(fixture.rubricVersion, `${path}.rubricVersion`);
  if (fixture.rubricVersion !== rubricVersion) {
    throw new TypeError(`${path}.rubricVersion must match catalog rubricVersion`);
  }

  assertObject(fixture.viewport, `${path}.viewport`);
  assertExactFields(fixture.viewport, ["width", "height"], `${path}.viewport`);
  for (const dimension of ["width", "height"]) {
    if (!Number.isInteger(fixture.viewport[dimension]) || fixture.viewport[dimension] <= 0) {
      throw new TypeError(`${path}.viewport.${dimension} must be a positive integer`);
    }
  }
  const expectedViewport = fixture.caseId.startsWith("canonical-")
    ? [1440, 1000]
    : [1024, 800];
  assertExactArray(
    [fixture.viewport.width, fixture.viewport.height],
    expectedViewport,
    `${path}.viewport`,
  );

  if (fixture.theme !== "light" && fixture.theme !== "dark") {
    throw new TypeError(`${path}.theme must be light or dark`);
  }

  assertUniqueStringArray(fixture.nativeViewTypes, `${path}.nativeViewTypes`);
  for (const viewType of fixture.nativeViewTypes) {
    if (!supportedViewTypes.has(viewType)) {
      throw new TypeError(
        `${path}.nativeViewTypes contains unsupported native view ${viewType}`,
      );
    }
  }
  assertUniqueStringArray(fixture.requiredContentIds, `${path}.requiredContentIds`);

  assertObject(fixture.topology, `${path}.topology`);
  assertExactFields(fixture.topology, topologyFields, `${path}.topology`);
  if (fixture.topology.workspaceModel !== "d1-desktop") {
    throw new TypeError(`${path}.topology.workspaceModel must be d1-desktop`);
  }
  if (!["single", "side-by-side"].includes(fixture.topology.rootArrangement)) {
    throw new TypeError(
      `${path}.topology.rootArrangement must be single or side-by-side`,
    );
  }
  if (!["native", "overflow-stress"].includes(fixture.topology.tabRail)) {
    throw new TypeError(`${path}.topology.tabRail must be native or overflow-stress`);
  }
  if (typeof fixture.topology.edgeFoldExpected !== "boolean") {
    throw new TypeError(`${path}.topology.edgeFoldExpected must be boolean`);
  }
  if (fixture.topology.leftDockVisible !== true) {
    throw new TypeError(`${path}.topology.leftDockVisible must be true`);
  }
  if (fixture.topology.nativeActionsVisible !== true) {
    throw new TypeError(`${path}.topology.nativeActionsVisible must be true`);
  }
  assertUniqueStringArray(fixture.topology.rightBanks, `${path}.topology.rightBanks`);
  assertExactArray(
    fixture.topology.rightBanks,
    ["properties", "outline"],
    `${path}.topology.rightBanks`,
  );
  if (!Array.isArray(fixture.topology.rootGroups) || fixture.topology.rootGroups.length === 0) {
    throw new TypeError(`${path}.topology.rootGroups must be a non-empty array`);
  }
  fixture.topology.rootGroups.forEach((group, groupIndex) =>
    validateRootGroup(group, `${path}.topology.rootGroups[${groupIndex}]`),
  );
  const expectedGroupCount =
    fixture.topology.rootArrangement === "side-by-side" ? 2 : 1;
  if (fixture.topology.rootGroups.length !== expectedGroupCount) {
    throw new TypeError(
      `${path}.topology.rootGroups must contain ${expectedGroupCount} group(s) for ${fixture.topology.rootArrangement}`,
    );
  }
  const expectedTabs = requiredCaseTabs.get(fixture.caseId);
  const expectedArrangement = expectedTabs.length === 2 ? "side-by-side" : "single";
  if (fixture.topology.rootArrangement !== expectedArrangement) {
    throw new TypeError(
      `${path}.topology.rootArrangement must be ${expectedArrangement} for ${fixture.caseId}`,
    );
  }
  expectedTabs.forEach((tabs, groupIndex) => {
    const group = fixture.topology.rootGroups[groupIndex];
    assertExactArray(
      group.tabs,
      tabs,
      `${path}.topology.rootGroups[${groupIndex}].tabs`,
    );
    if (group.activeViewType !== tabs[0]) {
      throw new TypeError(
        `${path}.topology.rootGroups[${groupIndex}].activeViewType must be ${tabs[0]}`,
      );
    }
  });

  const isNarrow = fixture.caseId === "narrow-mixed-stress";
  const expectedTabRail = isNarrow ? "overflow-stress" : "native";
  if (fixture.topology.tabRail !== expectedTabRail) {
    throw new TypeError(
      `${path}.topology.tabRail must be ${expectedTabRail} for ${fixture.caseId}`,
    );
  }
  if (fixture.topology.edgeFoldExpected !== isNarrow) {
    throw new TypeError(
      `${path}.topology.edgeFoldExpected must be ${isNarrow} for ${fixture.caseId}`,
    );
  }
  if (fixture.id !== `${fixture.caseId}-${fixture.theme}`) {
    throw new TypeError(`${path}.id must equal ${fixture.caseId}-${fixture.theme}`);
  }

  const expectedViews = [
    "file-explorer",
    ...new Set(fixture.topology.rootGroups.flatMap((group) => group.tabs)),
    "properties",
    "outline",
  ];
  assertExactArray(fixture.nativeViewTypes, expectedViews, `${path}.nativeViewTypes`);

  const expectedContentIds = [
    ...(isNarrow ? ["h5-long-bilingual-labels"] : []),
    ...new Set(
      expectedTabs
        .flat()
        .map((viewType) => contentIdByViewType.get(viewType))
        .filter(Boolean),
    ),
    "h5-file-tree",
  ];
  assertExactArray(
    fixture.requiredContentIds,
    expectedContentIds,
    `${path}.requiredContentIds`,
  );
}

export function validateFixtureCatalog(catalog) {
  assertObject(catalog, "fixture catalog");
  assertExactFields(catalog, catalogFields, "fixture catalog");
  if (catalog.schemaVersion !== 1) {
    throw new TypeError("schemaVersion must be 1");
  }
  assertSemver(catalog.fixtureVersion, "fixtureVersion");
  assertSemver(catalog.rubricVersion, "rubricVersion");
  assertSemver(catalog.requiredObsidianVersion, "requiredObsidianVersion");
  assertUniqueStringArray(catalog.transitions, "transitions");
  assertExactArray(catalog.transitions, requiredTransitions, "transitions");
  if (!Array.isArray(catalog.fixtures) || catalog.fixtures.length !== 10) {
    throw new TypeError("fixtures must contain the exact ten-view H5 matrix");
  }

  const ids = new Set();
  const matrixCases = new Set();
  for (const [index, fixture] of catalog.fixtures.entries()) {
    assertObject(fixture, `fixtures[${index}]`);
    if (ids.has(fixture.id)) {
      throw new TypeError(`fixture id ${fixture.id} is duplicated`);
    }
    ids.add(fixture.id);
  }
  for (const fixture of catalog.fixtures) {
    const matrixCase = `${fixture.caseId}:${fixture.theme}`;
    if (matrixCases.has(matrixCase)) {
      throw new TypeError(`fixture case ${matrixCase} is duplicated`);
    }
    matrixCases.add(matrixCase);
  }

  catalog.fixtures.forEach((fixture, index) =>
    validateFixture(fixture, index, catalog.rubricVersion),
  );

  const caseIds = new Set(catalog.fixtures.map((fixture) => fixture.caseId));
  if (
    caseIds.size !== requiredCaseTabs.size ||
    [...requiredCaseTabs.keys()].some((caseId) => !caseIds.has(caseId))
  ) {
    throw new TypeError("fixtures must define the five H5 schema v1 cases");
  }
  for (const caseId of caseIds) {
    for (const theme of ["light", "dark"]) {
      if (!matrixCases.has(`${caseId}:${theme}`)) {
        throw new TypeError(`fixture catalog is missing ${caseId}:${theme}`);
      }
    }

  }

  return catalog;
}

export async function readFixtureCatalog(catalogUrl) {
  let catalog;
  try {
    catalog = JSON.parse(await readFile(catalogUrl, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read H5 fixture catalog: ${error.message}`, {
      cause: error,
    });
  }

  return validateFixtureCatalog(catalog);
}
