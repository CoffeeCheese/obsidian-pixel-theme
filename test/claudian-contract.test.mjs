import assert from "node:assert/strict";
import test from "node:test";
import {
  atRuleBody,
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

const view =
  "body .workspace.workspace .workspace-leaf-content[data-type=claudian-view]";

function combinedAtRuleBody(css, prelude) {
  const bodies = [];
  let offset = 0;
  let start = css.indexOf(prelude, offset);

  while (start !== -1) {
    bodies.push(atRuleBody(css.slice(start), prelude));
    offset = start + prelude.length;
    start = css.indexOf(prelude, offset);
  }

  return bodies.join("\n");
}

test("Claudian keeps a bounded, content-first assistant layout", async () => {
  const css = await readTheme();
  const leaf = ruleBody(css, view);
  const container = ruleBody(
    css,
    `${view} .view-content.claudian-container`,
  );
  const chat = ruleBody(css, `${view} .claudian-chat-panel`);
  const messages = ruleBody(css, `${view} .claudian-messages`);

  assert.equal(declaration(leaf, "container"), "pixel-claudian-pane/inline-size");
  assert.equal(declaration(leaf, "min-inline-size"), "0");
  assert.equal(declaration(container, "margin"), "0");
  assert.equal(
    declaration(container, "padding"),
    "var(--pixel-space-3) var(--pixel-space-4) calc(var(--pixel-space-8) + var(--pixel-space-2))",
  );
  assert.equal(declaration(container, "overflow"), "hidden");
  assert.equal(declaration(container, "border"), "0");
  assert.equal(declaration(container, "background-image"), "none");
  assert.equal(declaration(chat, "max-inline-size"), "960px");
  assert.equal(declaration(chat, "margin-inline"), "auto");
  assert.match(declaration(messages, "padding"), /clamp\(/);
});

test("Claudian composer has one calm edge and an explicit focus state", async () => {
  const css = await readTheme();
  const wrapper = ruleBody(css, `${view} .claudian-input-wrapper`);
  const focused = ruleBody(css, `${view} .claudian-input-wrapper:focus-within`);
  const textarea = ruleBodyForSelector(
    css,
    `${view} .view-content.claudian-container .claudian-input-wrapper textarea.claudian-input`,
  );
  const chip = ruleBody(css, `${view} .claudian-context-chip`);

  assert.equal(
    declaration(wrapper, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-claudian-edge)",
  );
  assert.equal(declaration(wrapper, "border-radius"), "var(--pixel-radius-large)");
  assert.equal(declaration(focused, "border-color"), "var(--pixel-cyan)");
  assert.equal(
    declaration(focused, "box-shadow"),
    "var(--pixel-claudian-focus-ring)",
  );
  assert.equal(declaration(textarea, "border"), "0");
  assert.equal(declaration(textarea, "outline"), "0");
  assert.equal(declaration(textarea, "box-shadow"), "none");
  assert.equal(declaration(chip, "border-radius"), "999px");
  assert.equal(declaration(chip, "block-size"), "28px");
});

test("Claudian composer does not clip menus that open beyond its edge", async () => {
  const css = await readTheme();
  const wrapper = ruleBody(css, `${view} .claudian-input-wrapper`);

  // Claudian renders its model and thinking menus inside the composer and
  // positions them above the toolbar. Clipping the wrapper cuts off those
  // native interactive surfaces before z-index can take effect.
  assert.equal(declaration(wrapper, "overflow"), "visible");
});

test("active root Claudian tabs keep a clear state without plugin-owned status clearance", async () => {
  const css = await readTheme();
  const activeTab = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-root .workspace-tab-header[data-type=claudian-view].is-active",
  );

  assert.doesNotMatch(
    css,
    /workspace-split\.mod-root[^{}]*claudian-view[^{}]*\{[^}]*padding-block-end/is,
  );
  assert.equal(declaration(activeTab, "border"), "0");
  assert.equal(declaration(activeTab, "border-radius"), "var(--pixel-radius)");
  assert.equal(
    declaration(activeTab, "box-shadow"),
    "inset 0 -2px 0 var(--pixel-cyan)",
  );
});

test("Claudian adapts for narrow panes and accessibility preferences", async () => {
  const css = await readTheme();
  const compactWide = atRuleBody(
    css,
    "@container pixel-claudian-pane (max-width: 960px)",
  );
  const narrow = atRuleBody(
    css,
    "@container pixel-claudian-pane (max-width: 520px)",
  );
  const reduced = combinedAtRuleBody(css, "@media (prefers-reduced-motion: reduce)");
  const forced = combinedAtRuleBody(css, "@media (forced-colors: active)");
  const contrast = combinedAtRuleBody(css, "@media (prefers-contrast: more)");

  assert.match(compactWide, /claudian-wide-session-layout/);
  assert.match(compactWide, /claudian-session-sidebar/);
  assert.match(compactWide, /display:\s*none/);
  assert.match(compactWide, /max-inline-size:\s*100%/);
  assert.match(narrow, /padding-inline:\s*var\(--pixel-space-3\)/);
  assert.match(narrow, /padding-inline:\s*var\(--pixel-space-2\)/);
  assert.match(reduced, /claudian-input-wrapper/);
  assert.match(reduced, /transition:\s*none/);
  assert.match(forced, /CanvasText/);
  assert.match(forced, /Highlight/);
  assert.match(contrast, /claudian-context-chip/);
});
