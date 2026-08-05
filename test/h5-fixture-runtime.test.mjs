import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
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
