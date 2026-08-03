import assert from "node:assert/strict";
import test from "node:test";
import {
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

test("compiled package maps core navigation through documented Obsidian variables", async () => {
  const css = await readTheme();
  const theme = ruleBody(css, ".theme-light,\n.theme-dark");
  const expectedMappings = {
    "--nav-item-color": "var(--pixel-text-muted)",
    "--nav-item-color-hover": "var(--pixel-text)",
    "--nav-item-color-active": "var(--pixel-text)",
    "--nav-item-color-selected": "var(--pixel-text)",
    "--nav-item-color-highlighted": "var(--pixel-tree-signal)",
    "--nav-item-background-hover": "var(--pixel-surface-secondary)",
    "--nav-item-background-active": "var(--pixel-tree-active-surface)",
    "--nav-item-background-selected": "var(--pixel-tree-active-surface)",
    "--nav-item-weight-active": "600",
    "--nav-item-white-space": "normal",
    "--nav-item-children-padding-start": "var(--pixel-space-1)",
    "--nav-item-children-margin-start": "var(--pixel-space-3)",
    "--nav-indentation-guide-width": "var(--pixel-border-decoration)",
    "--nav-indentation-guide-color": "var(--pixel-line)",
    "--nav-collapse-icon-color": "var(--pixel-text-muted)",
    "--nav-collapse-icon-color-collapsed": "var(--pixel-tree-signal)",
    "--nav-heading-color": "var(--pixel-text)",
    "--nav-heading-color-collapsed": "var(--pixel-text-muted)",
    "--nav-heading-weight": "600",
    "--nav-tag-background": "var(--pixel-surface-secondary)",
    "--nav-tag-color": "var(--pixel-text-muted)",
    "--nav-tag-color-active": "var(--pixel-text)",
    "--search-result-background": "var(--pixel-paper)",
  };

  for (const [property, value] of Object.entries(expectedMappings)) {
    assert.equal(declaration(theme, property), value);
  }
});

test("Light and Dark provide pane-aware navigation state roles", async () => {
  const css = await readTheme();

  for (const selector of [".theme-light", ".theme-dark"]) {
    const mode = ruleBody(css, selector);
    assert.equal(declaration(mode, "--pixel-tree-signal"), "var(--pixel-cyan)");
    assert.equal(
      declaration(mode, "--pixel-tree-active-surface"),
      "var(--pixel-nav-label)",
    );
  }
});

test("tree rows keep hierarchy and expose distinct active, hover, and focus states", async () => {
  const css = await readTheme();
  const row = ruleBodyForSelector(css, ".tree-item-self");
  assert.equal(declaration(row, "border-inline-start"), "4px solid transparent");

  const active = ruleBody(
    css,
    ".tree-item-self:is(.is-active, .is-selected),\n.tag-pane-tag.is-active",
  );
  assert.equal(
    declaration(active, "border-inline-start-color"),
    "var(--pixel-tree-signal)",
  );
  assert.equal(
    declaration(active, "background-color"),
    "var(--pixel-tree-active-surface)",
  );
  assert.equal(declaration(active, "color"), "var(--pixel-text)");
  assert.equal(declaration(active, "font-weight"), "600");

  const activeHover = ruleBody(
    css,
    ".tree-item-self:is(.is-active, .is-selected):hover,\n  .tag-pane-tag.is-active:hover",
  );
  assert.equal(
    declaration(activeHover, "background-color"),
    "var(--pixel-surface-secondary)",
  );

  const focus = ruleBodyForSelector(css, ".tree-item-self.has-focus");
  assert.equal(
    declaration(focus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );

  const fileName = ruleBody(
    css,
    ".nav-file-title-content,\n.nav-folder-title-content",
  );
  assert.equal(declaration(fileName, "min-inline-size"), "0");
  assert.equal(declaration(fileName, "overflow-wrap"), "anywhere");
});

test("search results use shared surfaces without changing native replace-button layout", async () => {
  const css = await readTheme();
  const matches = ruleBody(css, ".search-result-file-matches");
  assert.equal(
    declaration(matches, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(matches, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(matches, "box-shadow"), "none");

  const matchedText = ruleBody(css, ".search-result-file-matched-text");
  assert.equal(
    declaration(matchedText, "background-color"),
    "var(--pixel-tree-active-surface)",
  );
  assert.equal(declaration(matchedText, "font-weight"), "600");

  const replaceButton = ruleBody(
    css,
    ".search-result-file-match-replace-button",
  );
  assert.doesNotMatch(
    replaceButton,
    /(?:display|position|inline-size|margin|inset|opacity|visibility|pointer-events)\s*:/i,
  );
  assert.equal(
    declaration(replaceButton, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
});

test("bookmarks, tags, badges, and empty states retain native structure", async () => {
  const css = await readTheme();
  const tag = ruleBodyForSelector(css, ".tag-pane-tag.is-active");
  assert.equal(
    declaration(tag, "border-inline-start-color"),
    "var(--pixel-tree-signal)",
  );

  const badge = ruleBodyForSelector(css, ".tag-pane-tag-count");
  assert.equal(
    declaration(badge, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-line)",
  );
  assert.equal(
    declaration(badge, "background-color"),
    "var(--pixel-surface-secondary)",
  );

  const emptyStates = ruleBodyForSelector(css, ".bookmarks-pane-empty");
  assert.equal(
    declaration(emptyStates, "border"),
    "var(--pixel-border-control) dashed var(--pixel-border-meaningful)",
  );

  assert.doesNotMatch(
    css,
    /(?:nav-action-button|tree-item-self|tag-pane-tag|search-result-file-match)[^{]*\{[^}]*(?:display:\s*none|pointer-events:\s*none)/is,
  );
});
