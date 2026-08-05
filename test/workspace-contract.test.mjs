import assert from "node:assert/strict";
import test from "node:test";
import {
  atRuleBody,
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";
import {
  narrowDesktopMediaQuery,
  narrowWorkspaceSpacing,
} from "../test-support/h5-contract.mjs";

test("compiled desktop package exposes the H5 split-label material roles", async () => {
  const css = await readTheme();
  const body = ruleBody(css, "body");
  const light = ruleBody(css, ".theme-light");
  const dark = ruleBody(css, ".theme-dark");

  assert.equal(declaration(body, "--pixel-workspace-gap"), "12px");
  assert.equal(declaration(body, "--pixel-workspace-inset"), "12px");
  assert.equal(declaration(light, "--pixel-nav-label"), "#c7dfe3");
  assert.equal(declaration(light, "--pixel-context-label"), "#f0e1d0");
  assert.equal(declaration(dark, "--pixel-nav-label"), "#254751");
  assert.equal(declaration(dark, "--pixel-context-label"), "#474135");
});

test("compiled desktop package exposes distinct N1 elevation and contour roles", async () => {
  const css = await readTheme();
  const body = ruleBody(css, "body");

  assert.equal(
    declaration(body, "--pixel-shadow-side-module"),
    "4px 4px 0 var(--pixel-shadow-color)",
  );
  assert.equal(
    declaration(body, "--pixel-shadow-cockpit"),
    "5px 5px 0 var(--pixel-shadow-color)",
  );
  assert.equal(
    declaration(body, "--pixel-shadow-buffer"),
    "3px 3px 0 var(--pixel-shadow-color)",
  );
  assert.equal(
    declaration(body, "--pixel-cockpit-contour"),
    "9px 9px 22px 9px",
  );
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
    assert.equal(
      declaration(dock, "box-shadow"),
      "var(--pixel-shadow-side-module)",
    );
    assert.equal(declaration(dock, "border-radius"), "0");
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
  const readerShell = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-root .workspace-tabs",
  );
  assert.equal(
    declaration(readerShell, "border"),
    "4px solid var(--pixel-text)",
  );
  assert.equal(
    declaration(readerShell, "background-color"),
    "var(--pixel-surface-secondary)",
  );
  assert.equal(
    declaration(readerShell, "box-shadow"),
    "var(--pixel-shadow-cockpit)",
  );
  assert.equal(
    declaration(readerShell, "border-radius"),
    "var(--pixel-cockpit-contour)",
  );
  assert.equal(declaration(readerShell, "overflow"), "hidden");
  assert.equal(declaration(readerShell, "background-image"), "none");

  const cartridgeRail = ruleBody(
    css,
    ":where(body:not(.is-mobile) .workspace-split.mod-root) .workspace-tab-header-container",
  );
  assert.equal(declaration(cartridgeRail, "min-block-size"), "42px");
  assert.equal(
    declaration(cartridgeRail, "border-block-end"),
    "var(--pixel-border-control) solid var(--pixel-text)",
  );
  const cartridge = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-root .workspace-tab-header",
  );
  assert.equal(declaration(cartridge, "min-inline-size"), "128px");

  const reader = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace-split.mod-root .view-content",
  );
  assert.equal(declaration(reader, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(reader, "box-shadow"), "none");
  assert.equal(declaration(reader, "text-shadow"), "none");
});

test("first-party non-Markdown and empty root leaves keep honest content tiers", async () => {
  const css = await readTheme();
  const specialized = ruleBody(
    css,
    ":where(body:not(.is-mobile) .workspace-split.mod-root) .workspace-leaf-content:not([data-type=markdown]):not([data-type=empty]) .view-content",
  );
  assert.equal(
    declaration(specialized, "background-color"),
    "var(--pixel-paper)",
  );
  assert.equal(declaration(specialized, "background-image"), "none");
  assert.equal(declaration(specialized, "box-shadow"), "none");

  const neutral = ruleBodyForSelector(
    css,
    ":where(body:not(.is-mobile) .workspace-split.mod-root) .workspace-leaf-content[data-type=empty] .view-content",
  );
  assert.equal(
    declaration(neutral, "background-color"),
    "var(--pixel-surface-secondary)",
  );
  assert.equal(declaration(neutral, "background-image"), "none");

  assert.doesNotMatch(
    css,
    /workspace-leaf-content:not\(\[data-type=["']markdown["']\]\)[^{]*\{[^}]*(?:read mode|pixel-screen-glow)/is,
  );
});

test("desktop active tabs and panes use side-aware multi-cue signals", async () => {
  const css = await readTheme();
  const activeCartridge = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-root .workspace-tab-header.is-active",
  );
  assert.equal(declaration(activeCartridge, "border"), "0");
  assert.equal(
    declaration(activeCartridge, "border-inline-start"),
    "5px solid var(--pixel-cyan)",
  );
  assert.equal(declaration(activeCartridge, "box-shadow"), "none");

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
    declaration(ribbon, "border"),
    "var(--pixel-border-shell) solid var(--pixel-text)",
  );
  assert.equal(
    declaration(ribbon, "box-shadow"),
    "var(--pixel-shadow-side-module)",
  );
  assert.equal(declaration(ribbon, "border-radius"), "0");

  const divider = ruleBody(css, "body:not(.is-mobile) .workspace-leaf-resize-handle");
  assert.equal(
    declaration(divider, "transition"),
    "background-color var(--pixel-motion-state) linear, border-color var(--pixel-motion-state) linear",
  );
});

test("the native global status bar is the sole Buffer Cartridge", async () => {
  const css = await readTheme();
  const buffer = ruleBody(css, "body:not(.is-mobile) .status-bar");

  assert.equal(declaration(buffer, "min-block-size"), "30px");
  assert.equal(declaration(buffer, "inset-inline-end"), "18px");
  assert.equal(declaration(buffer, "inset-block-end"), "14px");
  assert.equal(declaration(buffer, "padding"), "0 10px");
  assert.equal(declaration(buffer, "gap"), "8px");
  assert.equal(
    declaration(buffer, "border"),
    "var(--pixel-border-control) solid var(--pixel-text)",
  );
  assert.equal(declaration(buffer, "border-radius"), "0");
  assert.equal(
    declaration(buffer, "background-color"),
    "var(--pixel-surface-secondary)",
  );
  assert.equal(
    declaration(buffer, "box-shadow"),
    "var(--pixel-shadow-buffer)",
  );
  assert.doesNotMatch(css, /\.status-bar::(?:before|after)\s*\{[^}]*content:/is);
  assert.doesNotMatch(css, /\.workspace-(?:leaf|tabs)[^{]*::(?:before|after)\s*\{[^}]*content:\s*["'](?:buffer|count|words?)/is);
});

test("narrow desktop only reduces density and accessibility modes preserve D1", async () => {
  const css = await readTheme();
  const narrowDesktop = atRuleBody(css, narrowDesktopMediaQuery);
  const compactBody = ruleBody(narrowDesktop, "body:not(.is-mobile)");
  assert.equal(
    declaration(compactBody, "--pixel-workspace-gap"),
    narrowWorkspaceSpacing,
  );
  assert.equal(
    declaration(compactBody, "--pixel-workspace-inset"),
    narrowWorkspaceSpacing,
  );
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

  const forcedColors = atRuleBody(css, "@media (forced-colors: active)");
  const systemRoles = ruleBodyForSelector(forcedColors, ".theme-light");
  assert.equal(declaration(systemRoles, "--pixel-nav-label"), "canvas");
  assert.equal(declaration(systemRoles, "--pixel-context-label"), "canvas");
  assert.equal(declaration(systemRoles, "--pixel-shadow-shell"), "none");
});
