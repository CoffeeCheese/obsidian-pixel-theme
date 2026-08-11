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
    "--nav-tag-background": "var(--pixel-paper)",
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

test("quick switcher uses a light index-card shell and a pixel cursor rail", async () => {
  const css = await readTheme();
  const quickSwitcher =
    ".prompt:has(.prompt-instructions > .prompt-instruction:nth-child(4))";

  const shell = ruleBody(css, quickSwitcher);
  assert.equal(
    declaration(shell, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-line-strong)",
  );
  assert.equal(declaration(shell, "border-radius"), "var(--pixel-radius)");
  assert.equal(
    declaration(shell, "box-shadow"),
    "2px 2px 0 color-mix(in srgb, var(--pixel-shadow-color) 38%, transparent)",
  );

  const input = ruleBody(
    css,
    `${quickSwitcher} input.prompt-input,\n${quickSwitcher} input.prompt-input:hover,\n${quickSwitcher} input.prompt-input:focus-visible`,
  );
  assert.equal(declaration(input, "border"), "0");
  assert.equal(declaration(input, "outline"), "0");
  assert.equal(declaration(input, "box-shadow"), "none");
  assert.equal(
    declaration(input, "font-family"),
    "var(--pixel-font-identity)",
  );

  const cursorRail = ruleBody(
    css,
    `${quickSwitcher} .prompt-input-container::after`,
  );
  assert.equal(declaration(cursorRail, "inline-size"), "var(--pixel-space-4)");
  assert.equal(declaration(cursorRail, "block-size"), "3px");
  assert.equal(
    declaration(cursorRail, "background-color"),
    "var(--pixel-cyan)",
  );

  const selected = ruleBody(
    css,
    `${quickSwitcher} .suggestion-item.is-selected`,
  );
  assert.equal(declaration(selected, "border"), "0");
  assert.equal(declaration(selected, "outline"), "0");
  assert.equal(
    declaration(selected, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 10%, var(--pixel-paper))",
  );
  assert.equal(
    declaration(selected, "box-shadow"),
    "inset 3px 0 0 var(--pixel-cyan)",
  );

  const instructions = ruleBody(
    css,
    `${quickSwitcher} .prompt-instructions`,
  );
  assert.equal(
    declaration(instructions, "border-block-start"),
    "var(--pixel-border-decoration) solid var(--pixel-line)",
  );
});

test("global search stays inside the navigation pane with flat query and toggle surfaces", async () => {
  const css = await readTheme();

  const activeRow = ruleBody(
    css,
    "body .workspace.workspace .workspace-leaf.mod-active .workspace-leaf-content[data-type=search] .search-row",
  );
  assert.equal(
    declaration(activeRow, "anchor-name"),
    "--pixel-global-search-row",
  );

  const field = ruleBody(
    css,
    "body .workspace.workspace .workspace-leaf-content[data-type=search] .search-input-container.global-search-input-container input",
  );
  assert.equal(declaration(field, "block-size"), "36px");
  assert.equal(
    declaration(field, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-line-strong)",
  );
  assert.equal(
    declaration(field, "border-radius"),
    "var(--pixel-radius-large)",
  );

  const settings = ruleBody(
    css,
    "body .workspace.workspace .workspace-leaf-content[data-type=search] .search-params",
  );
  assert.equal(
    declaration(settings, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-line)",
  );
  assert.doesNotMatch(settings, /box-shadow\s*:/i);

  const toggle = ruleBody(
    css,
    "body .workspace.workspace .workspace-leaf-content[data-type=search] .search-params .checkbox-container",
  );
  assert.equal(declaration(toggle, "inline-size"), "40px");
  assert.equal(declaration(toggle, "block-size"), "22px");
  assert.equal(declaration(toggle, "box-shadow"), "none");

  const toggleThumb = ruleBody(
    css,
    "body .workspace.workspace .workspace-leaf-content[data-type=search] .search-params .checkbox-container::after",
  );
  assert.equal(declaration(toggleThumb, "inline-size"), "14px");
  assert.equal(declaration(toggleThumb, "block-size"), "14px");
  assert.equal(declaration(toggleThumb, "border"), "0");
  assert.equal(declaration(toggleThumb, "transform"), "none");

  const enabledToggle = ruleBody(
    css,
    "body .workspace.workspace .workspace-leaf-content[data-type=search] .search-params .checkbox-container.is-enabled",
  );
  assert.equal(
    declaration(enabledToggle, "--pixel-search-toggle-position"),
    "21px",
  );

  const suggestions = ruleBody(
    css,
    ".suggestion-container.mod-search-suggestion",
  );
  assert.equal(
    declaration(suggestions, "max-inline-size"),
    "anchor-size(--pixel-global-search-row width)",
  );
  assert.equal(
    declaration(suggestions, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-line-strong)",
  );
  assert.equal(declaration(suggestions, "box-shadow"), "none");
  assert.doesNotMatch(suggestions, /position-anchor\s*:/i);

  const selectedSuggestion = ruleBody(
    css,
    ".suggestion-container.mod-search-suggestion .search-suggest-item.is-selected",
  );
  assert.equal(declaration(selectedSuggestion, "outline"), "0");
  assert.equal(
    declaration(selectedSuggestion, "border-color"),
    "color-mix(in srgb, var(--pixel-cyan) 58%, var(--pixel-line-strong))",
  );
  assert.equal(
    declaration(selectedSuggestion, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 26%, var(--pixel-paper))",
  );
  assert.equal(
    declaration(selectedSuggestion, "box-shadow"),
    "inset 4px 0 0 var(--pixel-cyan)",
  );

  const selectedDescription = ruleBody(
    css,
    ".suggestion-container.mod-search-suggestion .search-suggest-item.is-selected .search-suggest-info-text",
  );
  assert.equal(
    declaration(selectedDescription, "color"),
    "var(--pixel-text)",
  );

  const selectedGroup = ruleBody(
    css,
    ".suggestion-container.mod-search-suggestion .search-suggest-item.mod-group.is-selected",
  );
  assert.equal(
    declaration(selectedGroup, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 26%, var(--pixel-paper))",
  );
  assert.equal(
    declaration(selectedGroup, "box-shadow"),
    "inset 4px 0 0 var(--pixel-cyan)",
  );

  const groupLabel = ruleBody(
    css,
    ".suggestion-container.mod-search-suggestion .search-suggest-item.mod-group",
  );
  assert.equal(
    declaration(groupLabel, "font-family"),
    "var(--pixel-font-identity)",
  );
  const queryOperator = ruleBody(
    css,
    ".suggestion-container.mod-search-suggestion .search-suggest-item:not(.mod-group) .suggestion-title > span:first-child:not(:only-child)",
  );
  assert.equal(
    declaration(queryOperator, "font-family"),
    "var(--pixel-font-monospace)",
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
    "var(--pixel-border-decoration) solid var(--pixel-border-meaningful)",
  );
  assert.equal(
    declaration(badge, "background-color"),
    "var(--pixel-paper)",
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

test("tag pane reads as a compact pixel index with keycaps and hierarchy", async () => {
  const css = await readTheme();
  const tagPane =
    "body .workspace.workspace .workspace-leaf-content[data-type=tag]";

  const header = ruleBody(css, `${tagPane} .nav-header`);
  assert.equal(
    declaration(header, "border-block-end"),
    "var(--pixel-border-decoration) solid var(--pixel-line)",
  );
  assert.equal(declaration(header, "background-color"), "var(--pixel-paper)");

  const activeAction = ruleBody(
    css,
    `${tagPane} .nav-action-button.is-active`,
  );
  assert.equal(declaration(activeAction, "border-color"), "var(--pixel-cyan)");
  assert.equal(
    declaration(activeAction, "background-color"),
    "var(--pixel-nav-label)",
  );

  const row = ruleBody(css, `${tagPane} .tag-pane-tag`);
  assert.equal(declaration(row, "min-block-size"), "var(--pixel-tag-row-min)");
  assert.equal(
    declaration(row, "border"),
    "var(--pixel-border-decoration) solid transparent",
  );
  assert.equal(declaration(row, "border-radius"), "var(--pixel-radius-small)");

  const label = ruleBody(css, `${tagPane} .tag-pane-tag > .tree-item-inner`);
  assert.equal(declaration(label, "display"), "flex");
  assert.equal(declaration(label, "min-inline-size"), "0");

  const labelText = ruleBody(
    css,
    `${tagPane} .tag-pane-tag > .tree-item-inner > .tree-item-inner-text`,
  );
  assert.equal(
    declaration(labelText, "font-family"),
    "var(--pixel-font-identity)",
  );
  assert.equal(declaration(labelText, "overflow-wrap"), "anywhere");

  const keycap = ruleBody(
    css,
    `${tagPane} .tag-pane-tag > .tree-item-inner::before`,
  );
  assert.equal(declaration(keycap, "content"), '"#"');
  assert.equal(declaration(keycap, "inline-size"), "var(--pixel-tag-key-size)");
  assert.equal(declaration(keycap, "border-radius"), "2px");
  assert.equal(
    declaration(keycap, "font-family"),
    "var(--pixel-font-monospace)",
  );
  assert.equal(declaration(keycap, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(keycap, "color"), "var(--pixel-cyan)");

  const count = ruleBody(css, `${tagPane} .tag-pane-tag-count`);
  assert.equal(declaration(count, "min-inline-size"), "24px");
  assert.equal(declaration(count, "border-radius"), "2px");
  assert.equal(declaration(count, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(count, "font-variant-numeric"), "tabular-nums");

  const hierarchy = ruleBody(css, `${tagPane} .tree-item-children`);
  assert.equal(
    declaration(hierarchy, "border-inline-start"),
    "var(--pixel-border-decoration) dashed var(--pixel-line-strong)",
  );

  const active = ruleBody(css, `${tagPane} .tag-pane-tag.is-active`);
  assert.equal(declaration(active, "transform"), "translate(1px, 1px)");
  assert.equal(
    declaration(active, "border-color"),
    "var(--pixel-cyan)",
  );
  assert.equal(
    declaration(active, "background-color"),
    "var(--pixel-nav-label)",
  );

  const tagPaneRules = [
    ...css.matchAll(
      /body \.workspace\.workspace \.workspace-leaf-content\[data-type=tag\][^{]*\{([^}]*)\}/g,
    ),
  ]
    .map((match) => match[1])
    .join("\n");
  assert.doesNotMatch(
    tagPaneRules,
    /--pixel-(?:amber|amber-text|context-label|tree-signal)/,
  );
});
