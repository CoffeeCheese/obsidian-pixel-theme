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

test("M1 belongs to the mobile platform at every viewport", async () => {
  const css = await readTheme();
  const mobile = combinedRuleBody(css, "body.is-mobile");

  assert.equal(declaration(mobile, "--mobile-sidebar-width"), "min(88vw, 420px)");
  assert.equal(declaration(mobile, "--mobile-sidebar-min-width"), "0px");
  assert.equal(declaration(mobile, "--mobile-sidebar-max-width"), "420px");
  assert.equal(declaration(mobile, "--view-header-height"), "56px");
  assert.equal(declaration(mobile, "--navbar-height"), "56px");
  assert.equal(declaration(mobile, "--mobile-toolbar-height"), "56px");
  assert.equal(declaration(mobile, "--inline-title-size"), "1.75em");

  for (const widthRule of css.matchAll(/@media\s*\([^)]*width[^)]*\)\s*\{/gi)) {
    const block = atRuleBody(css, widthRule[0].replace(/\s*\{$/, ""));
    assert.doesNotMatch(block, /body\.is-mobile|workspace-drawer/i);
  }
});

test("M1 keeps the note as the Paper base and styles native drawers by ownership", async () => {
  const css = await readTheme();
  const note = ruleBodyForSelector(
    css,
    "body.is-mobile .workspace-split.mod-root .view-content",
  );
  assert.equal(declaration(note, "background-color"), "var(--pixel-paper)");

  const stationaryBase = ruleBodyForSelector(
    css,
    "body.is-mobile .workspace.is-left-sidedock-open:has(> .workspace-drawer.mod-left:not(.is-pinned)) .workspace-split.mod-root",
  );
  assert.equal(
    declaration(stationaryBase, "translate"),
    "calc(-1 * var(--mobile-sidebar-width)) 0",
  );

  const drawer = ruleBody(css, "body.is-mobile .workspace-drawer");
  assert.equal(declaration(drawer, "inline-size"), "var(--mobile-sidebar-width)");
  assert.equal(declaration(drawer, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(drawer, "border-radius"), "var(--pixel-radius)");
  assert.equal(declaration(drawer, "box-shadow"), "var(--pixel-shadow-shell)");

  const left = ruleBody(css, "body.is-mobile .workspace-drawer.mod-left");
  assert.equal(declaration(left, "--pixel-tree-signal"), "var(--pixel-cyan)");
  assert.equal(declaration(left, "--pixel-tree-active-surface"), "var(--pixel-nav-label)");
  assert.equal(
    declaration(left, "border-inline-end"),
    "var(--pixel-border-shell) solid var(--pixel-cyan)",
  );

  const right = ruleBody(css, "body.is-mobile .workspace-drawer.mod-right");
  assert.equal(declaration(right, "--pixel-tree-signal"), "var(--pixel-amber-text)");
  assert.equal(
    declaration(right, "border-inline-start"),
    "var(--pixel-border-shell) solid var(--pixel-amber-text)",
  );
});

test("native mobile chrome is touch-safe and preserves non-color-only state", async () => {
  const css = await readTheme();
  const mobile = combinedRuleBody(css, "body.is-mobile");
  assert.equal(declaration(mobile, "--pixel-control-min"), "44px");
  assert.equal(declaration(mobile, "--pixel-icon-size"), "24px");

  const targets = ruleBodyForSelector(css, "body.is-mobile .mobile-navbar-action");
  assert.equal(declaration(targets, "min-inline-size"), "var(--pixel-control-min)");
  assert.equal(declaration(targets, "min-block-size"), "var(--pixel-control-min)");

  const spacing = ruleBodyForSelector(
    css,
    "body.is-mobile .mobile-navbar-actions",
  );
  assert.equal(declaration(spacing, "gap"), "var(--pixel-space-2)");

  const icon = ruleBody(
    css,
    "body.is-mobile :is(.workspace-drawer,\n.view-header,\n.mobile-navbar,\n.mobile-toolbar) .svg-icon",
  );
  assert.equal(declaration(icon, "inline-size"), "var(--pixel-icon-size)");
  assert.equal(declaration(icon, "block-size"), "var(--pixel-icon-size)");

  const active = ruleBody(
    css,
    "body.is-mobile .workspace-drawer .workspace-tab-header.is-active",
  );
  assert.equal(declaration(active, "border-inline-start"), "4px solid var(--pixel-tree-signal)");
  assert.equal(declaration(active, "background-color"), "var(--pixel-tree-active-surface)");
  assert.equal(declaration(active, "font-weight"), "600");
});

test("mobile bars and native backdrop preserve safe-area and dismissal behavior", async () => {
  const css = await readTheme();
  const mobile = combinedRuleBody(css, "body.is-mobile");
  assert.equal(
    declaration(mobile, "--navbar-bottom-offset"),
    "max(var(--safe-area-inset-bottom), var(--pixel-space-2))",
  );

  const navbarChrome = combinedRuleBody(css, "body.is-mobile .mobile-navbar.mod-raised");
  assert.equal(declaration(navbarChrome, "min-block-size"), "52px");
  const navbarPosition = ruleBody(
    css,
    "body.is-mobile .mobile-navbar.mod-raised",
  );
  assert.equal(
    declaration(navbarPosition, "inset-block-end"),
    "var(--navbar-bottom-offset)",
  );

  const toolbarChrome = combinedRuleBody(css, "body.is-mobile .mobile-toolbar");
  assert.equal(declaration(toolbarChrome, "min-block-size"), "56px");
  assert.doesNotMatch(toolbarChrome, /(?:position|inset-block-end|bottom)\s*:/);

  const backdrop = ruleBody(css, "body.is-mobile .workspace-drawer-backdrop");
  assert.equal(
    declaration(backdrop, "background-color"),
    "var(--background-modifier-cover)",
  );
  assert.doesNotMatch(backdrop, /(?:pointer-events|display)\s*:/);
});

test("mobile note chrome uses a compact index-card rhythm", async () => {
  const css = await readTheme();

  const headerAction = ruleBody(
    css,
    "body.is-mobile .view-header :is(.view-action, .sidebar-toggle-button)",
  );
  assert.equal(declaration(headerAction, "inline-size"), "var(--pixel-control-min)");
  assert.equal(declaration(headerAction, "border-radius"), "var(--pixel-radius)");

  const metadataContent = ruleBody(
    css,
    'body.is-mobile .workspace-leaf-content[data-type=markdown] .metadata-content',
  );
  assert.equal(declaration(metadataContent, "inline-size"), "100%");
  assert.equal(declaration(metadataContent, "border-radius"), "0");
  assert.equal(declaration(metadataContent, "background-color"), "transparent");

  const property = ruleBody(
    css,
    'body.is-mobile .workspace-leaf-content[data-type=markdown] .metadata-property',
  );
  assert.equal(declaration(property, "display"), "grid");
  assert.equal(
    declaration(property, "grid-template-columns"),
    "minmax(0, 104px) minmax(0, 1fr) auto",
  );
  assert.equal(declaration(property, "min-block-size"), "44px");
  assert.equal(declaration(property, "border-radius"), "0");

  const navbarAction = ruleBody(
    css,
    "body.is-mobile .mobile-navbar-action .clickable-icon",
  );
  assert.equal(declaration(navbarAction, "min-block-size"), "var(--pixel-control-min)");
  assert.equal(declaration(navbarAction, "border"), "0");
  assert.equal(declaration(navbarAction, "box-shadow"), "none");
});

test("M1 adds no custom gestures, hover dependencies, or fake controls", async () => {
  const css = await readTheme();
  const mobileSource = css.slice(css.indexOf("body.is-mobile {"));

  assert.doesNotMatch(mobileSource, /edge-swipe|touch-action|overscroll-behavior/);
  assert.doesNotMatch(mobileSource, /body\.is-mobile[^{}]*:hover/);
  assert.doesNotMatch(mobileSource, /body\.is-mobile[^{}]*::(?:before|after)/);
  assert.doesNotMatch(mobileSource, /display:\s*none/);
});

test("M1 drawer motion follows preferences and forced colors", async () => {
  const css = await readTheme();
  const mobileCss = css.slice(css.indexOf("--mobile-sidebar-width"));
  const reduced = atRuleBody(mobileCss, "@media (prefers-reduced-motion: reduce)");
  const drawer = ruleBodyForSelector(reduced, "body.is-mobile .workspace-drawer");
  assert.equal(declaration(drawer, "transition-duration"), "0ms");
  assert.equal(declaration(drawer, "animation"), "none");

  const forced = atRuleBody(mobileCss, "@media (forced-colors: active)");
  const forcedDrawer = ruleBodyForSelector(forced, "body.is-mobile .workspace-drawer");
  assert.equal(declaration(forcedDrawer, "border-color"), "canvastext");
  assert.equal(declaration(forcedDrawer, "background-color"), "canvas");
  assert.equal(declaration(forcedDrawer, "box-shadow"), "none");
});
