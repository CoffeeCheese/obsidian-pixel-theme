import assert from "node:assert/strict";
import test from "node:test";
import {
  atRuleBody,
  combinedRuleBody,
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";
import { narrowDesktopMediaQuery } from "../test-support/h5-contract.mjs";

test("the desktop context dock maps native properties to restrained Paper roles", async () => {
  const css = await readTheme();
  const contextDock = combinedRuleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split",
  );
  const expectedMappings = {
    "--metadata-background": "var(--pixel-paper)",
    "--metadata-border-color": "var(--pixel-border-meaningful)",
    "--metadata-divider-color": "var(--pixel-line)",
    "--metadata-divider-color-focus": "var(--pixel-cyan)",
    "--metadata-divider-width": "var(--pixel-border-decoration)",
    "--metadata-property-background": "var(--pixel-paper)",
    "--metadata-property-background-hover": "var(--pixel-surface-secondary)",
    "--metadata-property-background-active": "var(--pixel-context-label)",
    "--metadata-label-background": "var(--pixel-surface-secondary)",
    "--metadata-label-background-active": "var(--pixel-context-label)",
    "--metadata-label-text-color": "var(--pixel-text)",
    "--metadata-label-font-weight": "600",
    "--metadata-input-text-color": "var(--pixel-text)",
    "--metadata-input-background": "var(--pixel-paper)",
    "--metadata-input-background-active": "var(--pixel-context-label)",
    "--metadata-input-longtext-lines": "4",
  };

  for (const [property, value] of Object.entries(expectedMappings)) {
    assert.equal(declaration(contextDock, property), value);
  }
});

test("the right dock hides the current-note properties view and its tab", async () => {
  const css = await readTheme();
  const currentNoteProperties = ruleBody(
    css,
    'body:not(.is-mobile) .workspace-split.mod-right-split .workspace-leaf-content[data-type=file-properties] .metadata-container',
  );
  const currentNotePropertiesTab = ruleBody(
    css,
    'body:not(.is-mobile) .workspace-split.mod-right-split .workspace-tab-header[data-type=file-properties]',
  );

  assert.equal(declaration(currentNoteProperties, "display"), "none");
  assert.equal(declaration(currentNotePropertiesTab, "display"), "none");
  assert.doesNotMatch(
    css,
    /\.workspace-split\.mod-right-split\s+\.workspace-tab-header\[data-type=properties\][^{]*\{[^}]*display:\s*none/is,
  );
  assert.doesNotMatch(
    css,
    /\.workspace-split\.mod-right-split\s+\.workspace-leaf-content\[data-type=properties\]\s+\.metadata-container[^{}]*\{[^}]*display:\s*none/is,
  );
});

test("native property rows expose readable key-value, focus, validation, and action cues", async () => {
  const css = await readTheme();
  const property = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .metadata-property",
  );
  assert.equal(
    declaration(property, "border-inline-start"),
    "4px solid transparent",
  );
  assert.equal(declaration(property, "min-inline-size"), "0");

  const selected = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .metadata-container:focus-within .metadata-property.is-selected",
  );
  assert.equal(
    declaration(selected, "border-inline-start-color"),
    "var(--pixel-amber-text)",
  );
  assert.equal(
    declaration(selected, "background-color"),
    "var(--pixel-context-label)",
  );
  assert.equal(declaration(selected, "color"), "var(--pixel-text)");
  assert.equal(declaration(selected, "font-weight"), "600");

  const focus = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .metadata-property.has-focus",
  );
  assert.equal(
    declaration(focus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(focus, "outline-offset"), "2px");

  const longValue = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .metadata-input-longtext",
  );
  assert.equal(declaration(longValue, "white-space"), "pre-wrap");
  assert.equal(declaration(longValue, "overflow-wrap"), "anywhere");

  const action = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .metadata-add-button",
  );
  assert.equal(
    declaration(action, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(action, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(action, "color"), "var(--pixel-text)");

  const warning = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .metadata-property-warning-icon",
  );
  assert.equal(
    declaration(warning, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(
    declaration(warning, "background-color"),
    "var(--pixel-context-label)",
  );

  const error = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .metadata-error-container",
  );
  assert.equal(
    declaration(error, "border"),
    "var(--pixel-border-control) solid var(--pixel-brick)",
  );
  assert.equal(declaration(error, "border-inline-start-width"), "4px");
  assert.equal(declaration(error, "background-color"), "var(--pixel-paper)");
});

test("outline, backlinks, and outgoing links share amber multi-cue context selection", async () => {
  const css = await readTheme();

  for (const selector of [
    "body:not(.is-mobile) .workspace-split.mod-right-split .workspace-leaf-content[data-type=outline] .tree-item-self.is-active",
    "body:not(.is-mobile) .workspace-split.mod-right-split .backlink-pane .tree-item-self.is-active",
    "body:not(.is-mobile) .workspace-split.mod-right-split .outgoing-link-pane .tree-item-self.is-selected",
    "body:not(.is-mobile) .workspace-split.mod-right-split .search-result-file-match.is-selected",
  ]) {
    const selected = ruleBodyForSelector(css, selector);
    assert.equal(
      declaration(selected, "border-inline-start-color"),
      "var(--pixel-amber-text)",
    );
    assert.equal(
      declaration(selected, "background-color"),
      "var(--pixel-context-label)",
    );
    assert.equal(declaration(selected, "color"), "var(--pixel-text)");
    assert.equal(declaration(selected, "font-weight"), "600");
  }

  const matchedText = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .search-result-file-matched-text",
  );
  assert.equal(
    declaration(matchedText, "background-color"),
    "var(--pixel-context-label)",
  );
  assert.equal(declaration(matchedText, "color"), "var(--pixel-text)");
  assert.equal(declaration(matchedText, "font-weight"), "600");

  const group = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .backlink-pane > .tree-item-self",
  );
  assert.equal(
    declaration(group, "border-block-end"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );

  const unresolved = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .outgoing-link-item[aria-label]",
  );
  assert.equal(
    declaration(unresolved, "border-inline-end"),
    "var(--pixel-border-control) dashed var(--pixel-border-meaningful)",
  );
  assert.equal(
    declaration(unresolved, "background-color"),
    "var(--pixel-context-label)",
  );
  assert.equal(declaration(unresolved, "color"), "var(--pixel-text)");
  assert.equal(declaration(unresolved, "font-weight"), "600");
});

test("context panes retain native independent scrolling, depth, and interaction surfaces", async () => {
  const css = await readTheme();
  const contextScroll = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .backlink-pane",
  );
  assert.equal(declaration(contextScroll, "overflow-y"), "auto");
  assert.equal(declaration(contextScroll, "overscroll-behavior"), "contain");

  const outlineScroll = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .workspace-leaf-content[data-type=outline] .view-content",
  );
  assert.equal(declaration(outlineScroll, "overflow"), "auto");
  assert.equal(declaration(outlineScroll, "overscroll-behavior"), "contain");

  const outlineChildren = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .workspace-leaf-content[data-type=outline] .tree-item-children",
  );
  assert.equal(
    declaration(outlineChildren, "border-inline-start"),
    "var(--pixel-border-decoration) solid var(--pixel-line)",
  );

  assert.doesNotMatch(
    css,
    /(?:outline|backlink-pane|outgoing-link-pane|metadata-(?:add-button|show-source-button))[^{}]*\{[^}]*(?:display:\s*none|pointer-events:\s*none)/is,
  );
});

test("context states remain structural under forced colors and narrow desktop", async () => {
  const css = await readTheme();
  const forcedColors = atRuleBody(css, "@media (forced-colors: active)");
  const forcedContext = ruleBody(
    forcedColors,
    "body:not(.is-mobile) .workspace-split.mod-right-split",
  );
  assert.equal(declaration(forcedContext, "--pixel-tree-signal"), "highlight");
  assert.equal(
    declaration(forcedContext, "--pixel-tree-active-surface"),
    "canvas",
  );

  const narrowDesktop = atRuleBody(css, narrowDesktopMediaQuery);
  assert.doesNotMatch(
    narrowDesktop,
    /(?:outline|backlink-pane|outgoing-link-pane|metadata-container)[^{}]*\{[^}]*display:\s*none/is,
  );
});
