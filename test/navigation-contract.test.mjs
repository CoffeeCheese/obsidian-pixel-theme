import assert from "node:assert/strict";
import test from "node:test";
import {
  atRuleBody,
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

test("navigation variables expose readable hierarchy and cyan active state", async () => {
  const css = await readTheme();
  const variables = ruleBody(css, ".theme-light,\n.theme-dark");
  const expectedMappings = {
    "--nav-item-color": "var(--pixel-text-muted)",
    "--nav-item-color-hover": "var(--pixel-text)",
    "--nav-item-color-active": "var(--pixel-text)",
    "--nav-item-background-hover": "var(--pixel-surface-secondary)",
    "--nav-item-background-active": "var(--pixel-nav-label)",
    "--nav-item-weight-active": "600",
    "--nav-item-white-space": "normal",
    "--nav-indentation-guide-color": "var(--pixel-line)",
    "--nav-collapse-icon-color": "var(--pixel-text-muted)",
    "--nav-collapse-icon-color-collapsed": "var(--pixel-cyan)",
    "--nav-tag-background": "var(--pixel-surface-secondary)",
    "--nav-tag-color": "var(--pixel-text-muted)",
    "--nav-tag-color-active": "var(--pixel-text)",
  };

  for (const [property, value] of Object.entries(expectedMappings)) {
    assert.equal(declaration(variables, property), value);
  }

  const active = ruleBodyForSelector(css, ".tree-item-self.is-active");
  assert.equal(declaration(active, "background-color"), "var(--pixel-nav-label)");
  assert.equal(declaration(active, "color"), "var(--pixel-text)");
  assert.equal(
    declaration(active, "box-shadow"),
    "inset 4px 0 0 var(--pixel-cyan)",
  );
  assert.equal(declaration(active, "font-weight"), "600");

  const title = ruleBodyForSelector(css, ".nav-file-title-content");
  assert.equal(declaration(title, "min-inline-size"), "0");
  assert.equal(declaration(title, "overflow-wrap"), "anywhere");
});

test("search keeps native controls while grouping results with cyan signals", async () => {
  const css = await readTheme();
  const variables = ruleBody(css, ".theme-light,\n.theme-dark");
  assert.equal(
    declaration(variables, "--search-result-background"),
    "var(--pixel-paper)",
  );

  const input = ruleBodyForSelector(css, "input[type=search]");
  assert.equal(
    declaration(input, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(input, "background-color"), "var(--pixel-paper)");

  const resultGroup = ruleBody(css, ".search-result-file-matches");
  assert.equal(
    declaration(resultGroup, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(resultGroup, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(resultGroup, "box-shadow"), "none");

  const match = ruleBody(css, ".search-result-file-match");
  assert.equal(declaration(match, "background-color"), "transparent");
  assert.equal(
    declaration(match, "border-block-end"),
    "var(--pixel-border-decoration) solid var(--pixel-line)",
  );

  const highlighted = ruleBody(css, ".search-result-file-matched-text");
  assert.equal(
    declaration(highlighted, "background-color"),
    "var(--pixel-nav-label)",
  );
  assert.equal(declaration(highlighted, "color"), "var(--pixel-text)");
  assert.equal(declaration(highlighted, "font-weight"), "600");

  const focused = ruleBody(css, ".search-result-file-match.has-focus");
  assert.equal(
    declaration(focused, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(focused, "outline-offset"), "-2px");

  const replace = ruleBody(css, ".search-result-file-match-replace-button");
  assert.equal(declaration(replace, "display"), "block");
  assert.equal(declaration(replace, "min-block-size"), "var(--pixel-control-min)");
  assert.equal(declaration(replace, "background-color"), "var(--pixel-paper)");

  const empty = ruleBodyForSelector(css, ".search-empty-state");
  assert.equal(
    declaration(empty, "min-block-size"),
    "var(--pixel-state-min-block-size)",
  );
});

test("bookmarks and tags retain tree structure, counts, focus, and empty states", async () => {
  const css = await readTheme();

  const selected = ruleBodyForSelector(css, ".tree-item-self.is-selected");
  assert.equal(declaration(selected, "background-color"), "var(--pixel-nav-label)");
  assert.equal(declaration(selected, "color"), "var(--pixel-text)");
  assert.equal(
    declaration(selected, "box-shadow"),
    "inset 4px 0 0 var(--pixel-cyan)",
  );

  const activeTag = ruleBody(css, ".tag-pane-tag.is-active");
  assert.equal(declaration(activeTag, "background-color"), "var(--pixel-nav-label)");
  assert.equal(declaration(activeTag, "color"), "var(--pixel-text)");
  assert.equal(
    declaration(activeTag, "box-shadow"),
    "inset 4px 0 0 var(--pixel-cyan)",
  );
  assert.equal(declaration(activeTag, "font-weight"), "600");

  const hoveredActiveTag = ruleBody(css, ".tag-pane-tag.is-active:hover");
  assert.equal(
    declaration(hoveredActiveTag, "background-color"),
    "var(--pixel-nav-label)",
  );
  assert.equal(declaration(hoveredActiveTag, "color"), "var(--pixel-text)");
  assert.equal(
    declaration(hoveredActiveTag, "box-shadow"),
    "inset 4px 0 0 var(--pixel-cyan)",
  );

  const count = ruleBodyForSelector(css, ".tag-pane-tag-count");
  assert.equal(
    declaration(count, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-line)",
  );
  assert.equal(declaration(count, "background-color"), "var(--pixel-surface-secondary)");
  assert.equal(declaration(count, "color"), "var(--pixel-text-muted)");

  for (const selector of [
    ".tree-item-self.has-focus",
    ".tree-item.has-focus > .tag-pane-tag",
  ]) {
    const focused = ruleBodyForSelector(css, selector);
    assert.equal(
      declaration(focused, "outline"),
      "var(--pixel-border-control) solid var(--pixel-cyan)",
    );
    assert.equal(declaration(focused, "outline-offset"), "2px");
  }

  for (const selector of [".bookmarks-pane-empty", ".tag-pane-empty"]) {
    const empty = ruleBodyForSelector(css, selector);
    assert.equal(
      declaration(empty, "min-block-size"),
      "var(--pixel-state-min-block-size)",
    );
    assert.equal(
      declaration(empty, "border"),
      "var(--pixel-border-control) dashed var(--pixel-border-meaningful)",
    );
    assert.equal(
      declaration(empty, "background-color"),
      "var(--pixel-surface-secondary)",
    );
  }

  assert.doesNotMatch(
    css,
    /(?:bookmarks|tag)-(?:container|pane|item|tree)[^{]*\{[^}]*display:\s*none/is,
  );
});

test("deep navigation and native operations survive accessibility modes", async () => {
  const css = await readTheme();
  const variables = ruleBody(css, ".theme-light,\n.theme-dark");
  const expectedMappings = {
    "--nav-item-color-highlighted": "var(--pixel-cyan)",
    "--nav-item-children-padding-start": "var(--pixel-space-1)",
    "--nav-item-children-margin-start": "var(--pixel-space-3)",
    "--nav-indentation-guide-width": "var(--pixel-border-decoration)",
    "--nav-heading-color": "var(--pixel-text)",
    "--nav-heading-color-collapsed": "var(--pixel-text-muted)",
    "--nav-heading-weight": "600",
  };

  for (const [property, value] of Object.entries(expectedMappings)) {
    assert.equal(declaration(variables, property), value);
  }

  const forcedColors = atRuleBody(css, "@media (forced-colors: active)");
  const systemRoles = ruleBodyForSelector(forcedColors, ".theme-light");
  assert.equal(declaration(systemRoles, "--pixel-nav-label"), "canvas");
  assert.equal(declaration(systemRoles, "--pixel-cyan"), "highlight");

  const highContrast = atRuleBody(css, "@media (prefers-contrast: more)");
  const strongerRoles = ruleBodyForSelector(highContrast, ".theme-light");
  assert.equal(
    declaration(strongerRoles, "--pixel-border-meaningful"),
    "var(--pixel-text)",
  );

  assert.doesNotMatch(css, /\.(?:mini-)?d-?pad|direction(?:al)?-control/i);
  assert.doesNotMatch(
    css,
    /(?:collapse-icon|nav-file-icon|nav-file-tag|tree-item-flair|search-result-file-match-replace-button|tree-item-self)[^{]*\{[^}]*(?:display:\s*none|pointer-events:\s*none)/is,
  );
  assert.doesNotMatch(
    css,
    /(?:nav-files-container|tag-container|bookmarks-pane-empty)::(?:before|after)[^{]*\{[^}]*content:/is,
  );
});
