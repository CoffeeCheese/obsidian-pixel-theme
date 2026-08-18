import assert from "node:assert/strict";
import test from "node:test";
import {
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

const view =
  ".workspace-leaf-content[data-type=project-manager-insights-view]";

test("Project Manager Insights uses the Pixel ledger palette", async () => {
  const css = await readTheme();
  const body = ruleBody(css, view);
  assert.match(declaration(body, "--pmi-edge"), /--pixel-cyan/);
  assert.match(declaration(body, "--pmi-surface"), /--pixel-paper/);
  assert.equal(declaration(body, "font-family"), "var(--pixel-font-interface)");
});

test("Project Manager Insights keeps dense rows quieter than action buttons", async () => {
  const css = await readTheme();
  const member = ruleBody(css, `${view} button.pmi-member`);
  assert.equal(
    declaration(member, "border"),
    "var(--pixel-border-decoration) solid var(--pmi-edge)",
  );
  assert.equal(declaration(member, "box-shadow"), "none");

  const task = ruleBody(css, `${view} button.pmi-task-row`);
  assert.equal(declaration(task, "border"), "0");
  assert.equal(
    declaration(task, "border-block-end"),
    "var(--pixel-border-decoration) solid var(--pmi-edge)",
  );
  assert.equal(declaration(task, "box-shadow"), "none");

  const hover = ruleBody(css, `${view} button.pmi-task-row:hover`);
  assert.equal(declaration(hover, "transform"), "none");
  assert.equal(declaration(hover, "box-shadow"), "none");
});

test("Project Manager Insights search controls keep a one-pixel focus model", async () => {
  const css = await readTheme();
  const selector = `${view} input.pmi-pane-search`;
  const idle = ruleBodyForSelector(css, selector);
  assert.equal(
    declaration(idle, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-search-edge)",
  );
  assert.equal(declaration(idle, "box-shadow"), "none");

  const focus = ruleBody(
    css,
    `${view} .pmi-task-filters select:is(:focus, :focus-visible)`,
  );
  assert.equal(declaration(focus, "border-color"), "var(--pixel-cyan)");
  assert.equal(declaration(focus, "outline"), "0");
  assert.equal(
    declaration(focus, "box-shadow"),
    "var(--pixel-search-focus-shadow)",
  );
});
