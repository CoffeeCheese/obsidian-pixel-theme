import assert from "node:assert/strict";
import test from "node:test";
import {
  atRuleBody,
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

test("compiled desktop package exposes the H5 split-label material roles", async () => {
  const css = await readTheme();
  const body = ruleBody(css, "body");
  const light = ruleBody(css, ".theme-light");
  const dark = ruleBody(css, ".theme-dark");

  assert.equal(declaration(body, "--pixel-workspace-gap"), "12px");
  assert.equal(declaration(body, "--pixel-workspace-inset"), "12px");
  assert.equal(declaration(body, "--pixel-workspace-grid-size"), "24px");

  assert.equal(declaration(light, "--pixel-nav-label"), "#c7dfe3");
  assert.equal(declaration(light, "--pixel-context-label"), "#f0e1d0");
  assert.equal(declaration(dark, "--pixel-nav-label"), "#254751");
  assert.equal(declaration(dark, "--pixel-context-label"), "#474135");
});

test("visible desktop side docks keep Paper bodies with cyan and amber labels", async () => {
  const css = await readTheme();

  for (const selector of [
    "body:not(.is-mobile) .workspace-split.mod-left-split:not(.is-sidedock-collapsed)",
    "body:not(.is-mobile) .workspace-split.mod-right-split:not(.is-sidedock-collapsed)",
  ]) {
    const dock = ruleBodyForSelector(css, selector);
    assert.equal(declaration(dock, "background-color"), "var(--pixel-paper)");
    assert.equal(
      declaration(dock, "border"),
      "var(--pixel-border-shell) solid var(--pixel-text)",
    );
    assert.equal(declaration(dock, "box-shadow"), "var(--pixel-shadow-shell)");
  }

  const dockContents = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-left-split .workspace-tabs",
  );
  assert.equal(
    declaration(dockContents, "background-color"),
    "var(--pixel-paper)",
  );

  const navigationLabel = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-left-split .workspace-tab-header-container",
  );
  assert.equal(
    declaration(navigationLabel, "background-color"),
    "var(--pixel-nav-label)",
  );
  assert.equal(declaration(navigationLabel, "--icon-opacity"), "1");

  const contextLabel = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .workspace-tab-header-container",
  );
  assert.equal(
    declaration(contextLabel, "background-color"),
    "var(--pixel-context-label)",
  );
  assert.equal(declaration(contextLabel, "--icon-opacity"), "1");

  const sideLabels = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split:is(.mod-left-split, .mod-right-split) .workspace-tab-header-container",
  );
  assert.equal(declaration(sideLabels, "min-block-size"), "42px");
  assert.equal(
    declaration(sideLabels, "border-block-end"),
    "var(--pixel-border-decoration) solid var(--pixel-line)",
  );
});

test("desktop file rows retain native navigation while reading as raised cartridges", async () => {
  const css = await readTheme();
  const cartridge = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-left-split .nav-file-title",
  );
  assert.equal(declaration(cartridge, "min-block-size"), "34px");
  assert.equal(declaration(cartridge, "margin-block"), "var(--pixel-space-1)");
  assert.equal(
    declaration(cartridge, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(
    declaration(cartridge, "background-color"),
    "var(--pixel-paper)",
  );
  assert.equal(
    declaration(cartridge, "box-shadow"),
    "var(--pixel-shadow-control)",
  );

  const loadedCartridge = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-left-split .nav-file-title.is-active",
  );
  assert.equal(declaration(loadedCartridge, "transform"), "translate(2px, 2px)");
  assert.equal(declaration(loadedCartridge, "box-shadow"), "none");
  assert.equal(
    declaration(loadedCartridge, "border-inline-start-color"),
    "var(--pixel-cyan)",
  );
  assert.equal(
    declaration(loadedCartridge, "background-color"),
    "var(--pixel-nav-label)",
  );
});

test("desktop notes remain the primary shallow reader console", async () => {
  const css = await readTheme();
  const workspace = ruleBody(css, "body:not(.is-mobile) .workspace");
  assert.equal(declaration(workspace, "gap"), "var(--pixel-workspace-gap)");
  assert.equal(
    declaration(workspace, "padding"),
    "var(--pixel-workspace-inset)",
  );
  assert.equal(declaration(workspace, "background-color"), "var(--pixel-canvas)");
  assert.equal(
    declaration(workspace, "background-image"),
    "linear-gradient(var(--pixel-line) 1px, transparent 1px), linear-gradient(90deg, var(--pixel-line) 1px, transparent 1px)",
  );
  assert.equal(
    declaration(workspace, "background-size"),
    "var(--pixel-workspace-grid-size) var(--pixel-workspace-grid-size)",
  );

  const readerShell = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-root .workspace-tabs",
  );
  assert.equal(
    declaration(readerShell, "border"),
    "var(--pixel-border-shell) solid var(--pixel-text)",
  );
  assert.equal(
    declaration(readerShell, "background-color"),
    "var(--pixel-surface-secondary)",
  );
  assert.equal(declaration(readerShell, "box-shadow"), "var(--pixel-shadow-shell)");
  assert.equal(declaration(readerShell, "background-image"), "none");

  const consoleHeader = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-root .workspace-tab-header-container",
  );
  assert.equal(declaration(consoleHeader, "min-block-size"), "36px");
  assert.equal(
    declaration(consoleHeader, "border-block-end"),
    "var(--pixel-border-control) solid var(--pixel-text)",
  );
  assert.equal(
    declaration(consoleHeader, "background-color"),
    "var(--pixel-surface-secondary)",
  );

  const consoleStage = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-root .workspace-tab-container",
  );
  assert.equal(
    declaration(consoleStage, "background-color"),
    "var(--pixel-surface-secondary)",
  );

  const markdownScreen = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-root .workspace-leaf-content[data-type=markdown] .view-content",
  );
  assert.equal(
    declaration(markdownScreen, "border"),
    "4px solid var(--pixel-line)",
  );
  assert.equal(declaration(markdownScreen, "box-sizing"), "border-box");
  assert.equal(
    declaration(markdownScreen, "background-color"),
    "var(--pixel-paper)",
  );

  const reader = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-root .view-content",
  );
  assert.equal(declaration(reader, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(reader, "box-shadow"), "none");
  assert.equal(declaration(reader, "text-shadow"), "none");
});

test("desktop active tabs and panes use side-aware multi-cue signals", async () => {
  const css = await readTheme();
  const expectedTabs = new Map([
    [
      "body:not(.is-mobile) .workspace-split.mod-left-split .workspace-tab-header.is-active",
      "var(--pixel-cyan)",
    ],
    [
      "body:not(.is-mobile) .workspace-split.mod-right-split .workspace-tab-header.is-active",
      "var(--pixel-amber-text)",
    ],
  ]);

  for (const [selector, signal] of expectedTabs) {
    const activeTab = ruleBody(css, selector);
    assert.equal(declaration(activeTab, "background-color"), "var(--pixel-paper)");
    assert.equal(
      declaration(activeTab, "box-shadow"),
      `inset 0 -4px 0 ${signal}`,
    );
    assert.equal(declaration(activeTab, "color"), "var(--pixel-text)");
    assert.equal(declaration(activeTab, "font-weight"), "600");
  }

  const activeReader = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-root .workspace-leaf.mod-active",
  );
  assert.equal(
    declaration(activeReader, "--pixel-pane-signal"),
    "var(--pixel-cyan)",
  );

  const activeContext = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split .workspace-leaf.mod-active",
  );
  assert.equal(
    declaration(activeContext, "--pixel-pane-signal"),
    "var(--pixel-amber-text)",
  );

  const paneSignal = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-leaf.mod-active::after",
  );
  assert.equal(declaration(paneSignal, "content"), '""');
  assert.equal(declaration(paneSignal, "position"), "absolute");
  assert.equal(declaration(paneSignal, "inset-block"), "0");
  assert.equal(declaration(paneSignal, "inset-inline-start"), "0");
  assert.equal(declaration(paneSignal, "inline-size"), "4px");
  assert.equal(
    declaration(paneSignal, "background-color"),
    "var(--pixel-pane-signal)",
  );
  assert.equal(declaration(paneSignal, "pointer-events"), "none");

  assert.doesNotMatch(
    css,
    /(?:workspace-tab-header-inner-close-button|view-actions|sidebar-toggle-button)[^{]*\{[^}]*display:\s*none/is,
  );
});

test("desktop chrome maps titlebar, ribbon, tabs, dividers, status, and scrollbars", async () => {
  const css = await readTheme();
  const mappings = ruleBody(css, ".theme-light,\n.theme-dark");
  const expectedMappings = {
    "--divider-color": "var(--pixel-line)",
    "--divider-color-hover": "var(--pixel-cyan)",
    "--divider-width": "var(--pixel-border-decoration)",
    "--divider-width-hover": "var(--pixel-border-shell)",
    "--ribbon-background": "var(--pixel-canvas)",
    "--ribbon-background-collapsed": "var(--pixel-paper)",
    "--tab-container-background": "var(--pixel-surface-secondary)",
    "--tab-background-active": "var(--pixel-paper)",
    "--tab-outline-color": "var(--pixel-border-meaningful)",
    "--tab-outline-width": "var(--pixel-border-control)",
    "--status-bar-background": "var(--pixel-paper)",
    "--status-bar-border-color": "var(--pixel-border-meaningful)",
    "--status-bar-border-width": "var(--pixel-border-control) 0 0 var(--pixel-border-control)",
    "--status-bar-radius": "var(--pixel-radius)",
    "--scrollbar-bg": "var(--pixel-canvas)",
    "--scrollbar-thumb-bg": "var(--pixel-border-meaningful)",
    "--scrollbar-active-thumb-bg": "var(--pixel-cyan)",
    "--scrollbar-radius": "var(--pixel-radius)",
    "--titlebar-border-color": "var(--pixel-line)",
    "--titlebar-border-width": "var(--pixel-border-decoration)",
  };

  for (const [property, value] of Object.entries(expectedMappings)) {
    assert.equal(declaration(mappings, property), value);
  }

  const ribbon = ruleBody(css, "body:not(.is-mobile) .workspace-ribbon");
  assert.equal(
    declaration(ribbon, "border-inline-end"),
    "var(--pixel-border-shell) solid var(--pixel-border-meaningful)",
  );

  const divider = ruleBody(css, "body:not(.is-mobile) .workspace-leaf-resize-handle");
  assert.equal(
    declaration(divider, "transition"),
    "background-color var(--pixel-motion-state) linear, border-color var(--pixel-motion-state) linear",
  );
});

test("narrow desktop only reduces density and accessibility modes preserve D1", async () => {
  const css = await readTheme();
  const narrowDesktop = atRuleBody(css, "@media (max-width: 900px)");
  const compactBody = ruleBody(narrowDesktop, "body:not(.is-mobile)");
  assert.equal(declaration(compactBody, "--pixel-workspace-gap"), "4px");
  assert.equal(declaration(compactBody, "--pixel-workspace-inset"), "4px");
  assert.doesNotMatch(
    narrowDesktop,
    /workspace-split[^{}]*\{[^}]*display:\s*none/is,
  );
  assert.doesNotMatch(narrowDesktop, /workspace-drawer/i);

  const reducedMotion = atRuleBody(css, "@media (prefers-reduced-motion: reduce)");
  const motionlessDivider = ruleBodyForSelector(
    reducedMotion,
    ".workspace-leaf-resize-handle",
  );
  assert.equal(declaration(motionlessDivider, "transition-duration"), "0ms");
  assert.equal(declaration(motionlessDivider, "animation"), "none");

  const motionlessCartridge = ruleBodyForSelector(
    reducedMotion,
    ".nav-file-title",
  );
  assert.equal(declaration(motionlessCartridge, "transition-duration"), "0ms");
  assert.equal(declaration(motionlessCartridge, "animation"), "none");

  const forcedColors = atRuleBody(css, "@media (forced-colors: active)");
  const systemRoles = ruleBodyForSelector(forcedColors, ".theme-light");
  assert.equal(declaration(systemRoles, "--pixel-nav-label"), "canvas");
  assert.equal(declaration(systemRoles, "--pixel-context-label"), "canvas");
  assert.equal(declaration(systemRoles, "--pixel-shadow-shell"), "none");
});
