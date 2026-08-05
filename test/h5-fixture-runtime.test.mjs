import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assertN1ShellObservation,
  assertTransitionObservation,
  buildFixtureLayout,
  buildTransitionPlans,
  classifyRootArrangement,
  fixtureReaderPath,
  transitionLayoutSignature,
} from "../h5/fixture-runtime.mjs";

const catalog = await readFile(
  new URL("../h5/fixtures.v1.json", import.meta.url),
  "utf8",
).then(JSON.parse);

test("narrow fixture establishes its long bilingual native Markdown label", () => {
  const narrow = catalog.fixtures.find(
    ({ id }) => id === "narrow-mixed-stress-light",
  );
  const layout = buildFixtureLayout(narrow);
  const markdown = layout.main.children[0].children.find(
    (leaf) => leaf.state.type === "markdown",
  );

  assert.equal(
    fixtureReaderPath(narrow),
    "Pixel Bases QA/记录 64 — 中英混合长标题 Knowledge Item 64.md",
  );
  assert.equal(markdown.state.state.file, fixtureReaderPath(narrow));
});

test("root arrangement requires both group count and split direction", () => {
  const splitFixture = catalog.fixtures.find(
    ({ id }) => id === "canonical-split-units-light",
  );
  const layout = buildFixtureLayout(splitFixture);

  assert.equal(layout.main.direction, "vertical");
  assert.equal(classifyRootArrangement(layout.main), "side-by-side");

  layout.main.direction = "horizontal";
  assert.equal(classifyRootArrangement(layout.main), "stacked");
});

test("transition plans define six independently observable native states", () => {
  const fixture = catalog.fixtures.find(
    ({ id }) => id === "canonical-mixed-tabs-light",
  );
  const plans = buildTransitionPlans(fixture);

  assert.deepEqual(
    plans.map(({ transition }) => transition),
    catalog.transitions,
  );
  assert.equal(new Set(plans.map(({ layout }) => JSON.stringify(transitionLayoutSignature(layout)))).size, 5);
  assert.deepEqual(
    transitionLayoutSignature(plans.at(-1).layout),
    transitionLayoutSignature(buildFixtureLayout(fixture)),
  );

  const splitPlan = plans.find(({ transition }) => transition === "split");
  assert.doesNotThrow(() =>
    assertTransitionObservation(splitPlan, {
      layout: structuredClone(splitPlan.layout),
      rootGroupCount: 2,
      nativeActionsVisible: true,
    }),
  );
  const stacked = structuredClone(splitPlan.layout);
  stacked.main.direction = "horizontal";
  assert.throws(
    () =>
      assertTransitionObservation(splitPlan, {
        layout: stacked,
        rootGroupCount: 2,
        nativeActionsVisible: true,
      }),
    /split transition layout was not established/,
  );
});

test("runtime N1 shell observation enforces per-group ownership and role elevation", () => {
  const fixture = catalog.fixtures.find(
    ({ id }) => id === "canonical-split-units-light",
  );
  const observation = {
    workspace: {
      gridSize: "24px 24px",
      gap: "12px",
      padding: "12px",
    },
    ribbon: {
      shadowOffset: [4, 4],
      cornerRadii: [0, 0, 0, 0],
    },
    sideModules: [
      { shadowOffset: [4, 4], cornerRadii: [0, 0, 0, 0] },
      { shadowOffset: [4, 4], cornerRadii: [0, 0, 0, 0] },
    ],
    rootGroups: [
      {
        shadowOffset: [5, 5],
        borderWidths: [4, 4, 4, 4],
        cornerRadii: [9, 9, 22, 9],
      },
      {
        shadowOffset: [5, 5],
        borderWidths: [4, 4, 4, 4],
        cornerRadii: [9, 9, 22, 9],
      },
    ],
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
      rootGroupCount: 2,
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
  };

  assert.doesNotThrow(() => assertN1ShellObservation(fixture, observation));
  assert.throws(
    () =>
      assertN1ShellObservation(fixture, {
        ...observation,
        rootGroups: observation.rootGroups.map((group) => ({
          ...group,
          shadowOffset: [4, 4],
        })),
      }),
    /Cockpit Unit shadow role/,
  );
  assert.throws(
    () =>
      assertN1ShellObservation(fixture, {
        ...observation,
        gridOwnerCount: 2,
      }),
    /canvas grid must belong only to the workspace/,
  );

  const narrowFixture = catalog.fixtures.find(
    ({ id }) => id === "narrow-mixed-stress-light",
  );
  assert.doesNotThrow(() =>
    assertN1ShellObservation(narrowFixture, {
      ...observation,
      workspace: { ...observation.workspace, gap: "8px", padding: "8px" },
      rootGroups: [
        {
          ...observation.rootGroups[0],
          cornerRadii: [7, 7, 16, 7],
        },
      ],
      textScale200: {
        ...observation.textScale200,
        rootGroupCount: 1,
      },
    }),
  );
});
