import assert from "node:assert/strict";
import test from "node:test";
import {
  atRuleBody,
  declaration,
  matchingRuleBodies,
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
  assert.equal(declaration(light, "--pixel-nav-label"), "#dcebed");
  assert.equal(declaration(light, "--pixel-context-label"), "#f3eee3");
  assert.equal(declaration(light, "--pixel-context-control-hover"), "#edf4f6");
  assert.equal(declaration(light, "--pixel-context-control-active"), "#dcebed");
  assert.equal(declaration(dark, "--pixel-nav-label"), "#203d46");
  assert.equal(declaration(dark, "--pixel-context-label"), "#2a2926");
  assert.equal(declaration(dark, "--pixel-context-control-hover"), "#1d3038");
  assert.equal(declaration(dark, "--pixel-context-control-active"), "#234047");
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
  assert.equal(declaration(body, "--pixel-cartridge-rail-min"), "48px");
  assert.equal(declaration(body, "--pixel-cartridge-rail-padding-block"), "6px");
  assert.equal(declaration(body, "--pixel-cartridge-rail-padding-inline"), "8px");
  assert.equal(declaration(body, "--pixel-cartridge-rail-gap"), "6px");
  assert.equal(declaration(body, "--pixel-content-chassis-inset"), "8px");
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
    assert.equal(
      declaration(dock, "border-radius"),
      "var(--pixel-radius-large)",
    );
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
  assert.equal(
    declaration(cartridgeRail, "min-block-size"),
    "var(--pixel-cartridge-rail-min)",
  );
  assert.equal(
    declaration(cartridgeRail, "padding-block"),
    "var(--pixel-cartridge-rail-padding-block)",
  );
  assert.equal(
    declaration(cartridgeRail, "padding-inline"),
    "var(--pixel-cartridge-rail-padding-inline)",
  );
  assert.equal(
    declaration(cartridgeRail, "gap"),
    "var(--pixel-cartridge-rail-gap)",
  );
  assert.equal(
    declaration(cartridgeRail, "border-block-end"),
    "var(--pixel-border-control) solid var(--pixel-text)",
  );
  assert.doesNotMatch(
    css,
    /workspace-split\.mod-root\s+\.workspace-tab-header[^,{]*\{[^}]*(?:inline-size|width):\s*128px/is,
  );

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
  assert.equal(
    declaration(specialized, "margin"),
    "var(--pixel-content-chassis-inset)",
  );
  assert.equal(
    declaration(specialized, "border"),
    "var(--pixel-border-control) solid var(--pixel-line)",
  );

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
    "6px solid var(--pixel-cyan)",
  );
  assert.equal(declaration(activeCartridge, "box-shadow"), "none");

  const expectedTabs = new Map([
    [
      "body:not(.is-mobile) .workspace-split.mod-left-split .workspace-tab-header.is-active",
      {
        background: "var(--pixel-paper)",
        signal: "var(--pixel-cyan)",
      },
    ],
    [
      "body:not(.is-mobile) .workspace-split.mod-right-split .workspace-tab-header.is-active",
      {
        background: "var(--pixel-context-control-active)",
        signal: "var(--pixel-cyan)",
      },
    ],
  ]);

  for (const [selector, { background, signal }] of expectedTabs) {
    const activeTab = ruleBody(css, selector);
    assert.equal(declaration(activeTab, "background-color"), background);
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
    "--status-bar-border-width": "var(--pixel-border-decoration)",
    "--status-bar-position": "fixed",
    "--status-bar-radius": "var(--pixel-radius-large) 0 0 0",
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
  assert.equal(
    declaration(ribbon, "border-radius"),
    "var(--pixel-radius-large)",
  );

  const divider = ruleBody(css, "body:not(.is-mobile) .workspace-leaf-resize-handle");
  assert.equal(
    declaration(divider, "transition"),
    "background-color var(--pixel-motion-state) linear, border-color var(--pixel-motion-state) linear",
  );
});

test("the global status rail docks compactly without changing workspace flow", async () => {
  const css = await readTheme();
  const dock = matchingRuleBodies(
    css,
    "body:not(.is-mobile) .workspace-split.mod-right-split:not(.is-sidedock-collapsed)",
  ).at(-1);
  const buffer = ruleBody(css, "body:not(.is-mobile) .status-bar");
  const item = ruleBody(css, "body:not(.is-mobile) .status-bar-item");
  const mascot = ruleBody(css, "body:not(.is-mobile) .status-bar::before");
  const iconItem = ruleBody(
    css,
    "body:not(.is-mobile) .status-bar-item[aria-label]",
  );
  const textItem = ruleBody(
    css,
    "body:not(.is-mobile) .status-bar-item:not([aria-label])",
  );
  const hover = ruleBody(
    css,
    "body:not(.is-mobile) .status-bar-item.mod-clickable:hover",
  );

  assert.equal(declaration(dock, "anchor-name"), "--pixel-right-dock");
  assert.equal(declaration(buffer, "position"), "fixed");
  assert.equal(declaration(buffer, "inset-inline-end"), "0");
  assert.equal(declaration(buffer, "inset-block-end"), "0");
  assert.equal(
    declaration(buffer, "inline-size"),
    "calc(anchor-size(--pixel-right-dock width, min(432px, 100vw)) - var(--pixel-space-3))",
  );
  assert.equal(
    declaration(buffer, "max-inline-size"),
    "calc(100vw - var(--pixel-space-3))",
  );
  assert.equal(declaration(buffer, "min-block-size"), "32px");
  assert.equal(declaration(buffer, "max-block-size"), "36px");
  assert.equal(declaration(buffer, "padding"), "3px 6px");
  assert.equal(declaration(buffer, "gap"), "0");
  assert.equal(declaration(buffer, "overflow-x"), "auto");
  assert.equal(
    declaration(buffer, "border"),
    "var(--pixel-border-decoration) solid color-mix(in srgb, var(--pixel-cyan) 36%, var(--pixel-line))",
  );
  assert.equal(
    declaration(buffer, "border-radius"),
    "var(--pixel-radius-large) 0 0 0",
  );
  assert.match(declaration(buffer, "background-color"), /color-mix\(/);
  assert.match(declaration(buffer, "box-shadow"), /inset 0 1px 0/);
  assert.equal(declaration(mascot, "content"), '""');
  assert.equal(declaration(mascot, "inline-size"), "14px");
  assert.equal(declaration(mascot, "block-size"), "14px");
  assert.equal(declaration(mascot, "pointer-events"), "none");
  assert.match(declaration(mascot, "background"), /radial-gradient\(/);
  assert.match(declaration(mascot, "background"), /linear-gradient\(/);
  assert.equal(declaration(item, "min-block-size"), "24px");
  assert.equal(declaration(item, "padding-inline"), "2px");
  assert.equal(
    declaration(item, "font-size"),
    "calc(var(--font-ui-smaller) - 1px)",
  );
  assert.equal(declaration(item, "border-radius"), "var(--pixel-radius-small)");
  assert.equal(declaration(iconItem, "flex"), "0 0 auto");
  assert.equal(declaration(textItem, "min-inline-size"), "0");
  assert.equal(declaration(textItem, "overflow"), "hidden");
  assert.equal(declaration(textItem, "text-overflow"), "ellipsis");
  assert.equal(declaration(textItem, "white-space"), "nowrap");
  assert.match(declaration(hover, "background-color"), /color-mix\(/);
  assert.doesNotMatch(buffer, /inline-size:\s*100%/);
  assert.doesNotMatch(mascot, /content:\s*["'][^"']+["']/is);
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
  assert.equal(
    declaration(compactBody, "--pixel-cockpit-contour"),
    "7px 7px 16px 7px",
  );
  assert.equal(declaration(compactBody, "--pixel-cartridge-rail-min"), "42px");
  assert.equal(
    declaration(compactBody, "--pixel-cartridge-rail-padding-block"),
    "4px",
  );
  assert.equal(
    declaration(compactBody, "--pixel-cartridge-rail-padding-inline"),
    "6px",
  );
  assert.equal(declaration(compactBody, "--pixel-cartridge-rail-gap"), "4px");
  assert.equal(declaration(compactBody, "--pixel-content-chassis-inset"), "4px");
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
