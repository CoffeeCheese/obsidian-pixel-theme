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

  assert.equal(declaration(mobile, "--mobile-sidebar-width"), "min(84vw, 400px)");
  assert.equal(declaration(mobile, "--mobile-sidebar-min-width"), "0px");
  assert.equal(declaration(mobile, "--mobile-sidebar-max-width"), "400px");
  assert.equal(declaration(mobile, "--view-header-height"), "64px");
  assert.equal(declaration(mobile, "--navbar-height"), "64px");
  assert.equal(declaration(mobile, "--mobile-toolbar-height"), "64px");
  assert.equal(declaration(mobile, "--inline-title-size"), "1.55em");
  assert.equal(declaration(mobile, "--pixel-mobile-control-size"), "48px");
  assert.equal(declaration(mobile, "--pixel-mobile-control-radius"), "16px");
  assert.equal(declaration(mobile, "--pixel-mobile-panel-radius"), "24px");
  assert.equal(declaration(mobile, "--pixel-mobile-header-tile-radius"), "18px");
  assert.equal(declaration(mobile, "--pixel-mobile-header-tray-radius"), "24px");
  assert.match(
    declaration(mobile, "--pixel-mobile-control-border"),
    /var\(--pixel-border-meaningful\) 76%/,
  );

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

  assert.doesNotMatch(
    css,
    /body\.is-mobile\s+\.workspace\.is-(?:left|right)-sidedock-open[^{}]*\.workspace-split\.mod-root\s*\{/,
  );

  const drawer = ruleBody(css, "body.is-mobile .workspace-drawer");
  assert.equal(declaration(drawer, "inline-size"), "var(--mobile-sidebar-width)");
  assert.equal(declaration(drawer, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(drawer, "border-radius"), "var(--mobile-sidebar-radius)");
  assert.equal(declaration(drawer, "box-shadow"), "var(--pixel-mobile-floating-shadow)");

  const left = ruleBody(css, "body.is-mobile .workspace-drawer.mod-left");
  assert.equal(declaration(left, "--pixel-tree-signal"), "var(--pixel-cyan)");
  assert.equal(declaration(left, "--pixel-tree-active-surface"), "var(--pixel-nav-label)");
  assert.equal(
    declaration(left, "border-inline-end"),
    "var(--pixel-border-decoration) solid var(--pixel-line-strong)",
  );
  assert.match(declaration(left, "box-shadow"), /8px 0 24px/);

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
    "max(var(--safe-area-inset-bottom), var(--pixel-space-3))",
  );

  const navbarChrome = combinedRuleBody(css, "body.is-mobile .mobile-navbar.mod-raised");
  assert.equal(declaration(navbarChrome, "min-block-size"), "var(--navbar-height)");
  const navbarPosition = ruleBody(
    css,
    "body.is-mobile .mobile-navbar.mod-raised",
  );
  assert.equal(
    declaration(navbarPosition, "inset-block-end"),
    "var(--navbar-bottom-offset)",
  );

  const toolbarChrome = combinedRuleBody(css, "body.is-mobile .mobile-toolbar");
  assert.equal(declaration(toolbarChrome, "min-block-size"), "var(--mobile-toolbar-height)");
  assert.doesNotMatch(toolbarChrome, /(?:position|inset-block-end|bottom)\s*:/);

  const backdrop = ruleBody(css, "body.is-mobile .workspace-drawer-backdrop");
  assert.equal(
    declaration(backdrop, "background-color"),
    "var(--background-modifier-cover)",
  );
  assert.doesNotMatch(backdrop, /(?:pointer-events|display)\s*:/);
});

test("mobile note chrome uses a soft index-card editing rhythm", async () => {
  const css = await readTheme();

  const headerAction = ruleBody(
    css,
    "body.is-mobile .view-header :is(.view-action, .sidebar-toggle-button)",
  );
  assert.equal(
    declaration(headerAction, "inline-size"),
    "var(--pixel-mobile-control-size)",
  );
  assert.equal(
    declaration(headerAction, "border-radius"),
    "var(--pixel-mobile-header-tile-radius)",
  );
  assert.equal(
    declaration(headerAction, "border"),
    "0",
  );
  assert.equal(declaration(headerAction, "background"), "var(--pixel-paper)");
  assert.equal(
    declaration(headerAction, "box-shadow"),
    "var(--pixel-mobile-header-shadow)",
  );

  const headerShell = combinedRuleBody(css, "body.is-mobile .view-header");
  assert.equal(declaration(headerShell, "border-radius"), "0");
  assert.equal(declaration(headerShell, "background"), "transparent");
  assert.equal(declaration(headerShell, "box-shadow"), "none");
  assert.equal(declaration(headerShell, "--raised-background"), "transparent");
  assert.equal(declaration(headerShell, "--raised-shadow"), "none");
  assert.equal(declaration(headerShell, "--raised-blur"), "none");
  assert.equal(declaration(headerShell, "--raised-mask-display"), "none");
  assert.equal(declaration(headerShell, "--raised-mask-background"), "transparent");
  assert.equal(declaration(headerShell, "--raised-mask-border-width"), "0px");

  const leftDrawerToggle = ruleBody(
    css,
    "body.is-mobile .view-header .sidebar-toggle-button.mod-left",
  );
  assert.equal(declaration(leftDrawerToggle, "border"), "0");
  assert.equal(
    declaration(leftDrawerToggle, "border-radius"),
    "var(--pixel-mobile-header-tile-radius)",
  );
  assert.equal(declaration(leftDrawerToggle, "background"), "var(--pixel-paper)");
  assert.equal(
    declaration(leftDrawerToggle, "box-shadow"),
    "var(--pixel-mobile-header-shadow)",
  );

  const headerGroup = ruleBody(
    css,
    "body.is-mobile .view-header .view-actions.mod-raised",
  );
  assert.equal(
    declaration(headerGroup, "border-radius"),
    "var(--pixel-mobile-header-tray-radius)",
  );
  assert.equal(declaration(headerGroup, "gap"), "0");
  assert.equal(
    declaration(headerGroup, "block-size"),
    "var(--pixel-mobile-control-size)",
  );
  assert.equal(declaration(headerGroup, "background"), "var(--pixel-paper)");
  assert.equal(
    declaration(headerGroup, "box-shadow"),
    "var(--pixel-mobile-header-shadow)",
  );
  assert.equal(declaration(headerGroup, "align-self"), "center");

  const groupedAction = ruleBody(
    css,
    "body.is-mobile .view-header .view-actions.mod-raised .view-action",
  );
  assert.equal(
    declaration(groupedAction, "inline-size"),
    "var(--pixel-mobile-control-size)",
  );
  assert.equal(declaration(groupedAction, "box-shadow"), "none");

  const groupedActionStart = ruleBody(
    css,
    "body.is-mobile .view-header .view-actions.mod-raised .view-action:first-child",
  );
  assert.equal(
    declaration(groupedActionStart, "border-start-start-radius"),
    "var(--pixel-mobile-header-tray-radius)",
  );

  const groupedActionEnd = ruleBody(
    css,
    "body.is-mobile .view-header .view-actions.mod-raised .view-action:last-child",
  );
  assert.equal(
    declaration(groupedActionEnd, "border-start-end-radius"),
    "var(--pixel-mobile-header-tray-radius)",
  );

  const propertyDisclosure = ruleBody(
    css,
    'body.is-mobile .workspace-leaf-content[data-type=markdown] .metadata-properties-heading .collapse-indicator',
  );
  assert.equal(declaration(propertyDisclosure, "position"), "static");
  assert.equal(declaration(propertyDisclosure, "inline-size"), "28px");
  assert.equal(declaration(propertyDisclosure, "opacity"), "1");

  const propertyHeading = ruleBody(
    css,
    'body.is-mobile .workspace-leaf-content[data-type=markdown] .metadata-properties-heading',
  );
  assert.equal(declaration(propertyHeading, "display"), "inline-flex");
  assert.equal(declaration(propertyHeading, "align-items"), "center");

  const mobileMenu = ruleBody(
    css,
    "body.is-mobile :is(.menu, .suggestion-container, .prompt, .modal, .notice, .tooltip)",
  );
  assert.equal(
    declaration(mobileMenu, "border-radius"),
    "var(--pixel-mobile-panel-radius)",
  );
  assert.equal(
    declaration(mobileMenu, "box-shadow"),
    "var(--pixel-mobile-floating-shadow)",
  );

  const metadataContent = ruleBody(
    css,
    'body.is-mobile .workspace-leaf-content[data-type=markdown] .metadata-content',
  );
  assert.equal(declaration(metadataContent, "inline-size"), "100%");
  assert.equal(
    declaration(metadataContent, "border-radius"),
    "var(--pixel-mobile-panel-radius)",
  );
  assert.match(
    declaration(metadataContent, "background-color"),
    /var\(--pixel-surface-secondary\) 28%/,
  );
  assert.equal(declaration(metadataContent, "box-shadow"), "none");

  const property = ruleBody(
    css,
    'body.is-mobile .workspace-leaf-content[data-type=markdown] .metadata-property',
  );
  assert.equal(declaration(property, "display"), "grid");
  assert.equal(
    declaration(property, "grid-template-columns"),
    "minmax(104px, 30%) minmax(0, 1fr) auto",
  );
  assert.equal(declaration(property, "min-block-size"), "48px");
  assert.equal(declaration(property, "border-radius"), "12px");

  const focusedProperty = ruleBodyForSelector(
    css,
    'body.is-mobile .workspace-leaf-content[data-type=markdown] .metadata-property:focus-within',
  );
  assert.equal(declaration(focusedProperty, "z-index"), "1");
  assert.match(declaration(focusedProperty, "box-shadow"), /inset 3px 0 0 var\(--pixel-cyan\)/);

  const propertyMenu = ruleBody(
    css,
    'body.is-mobile .suggestion-container.mod-property-key',
  );
  assert.equal(
    declaration(propertyMenu, "inline-size"),
    "min(200px, 100vw - var(--pixel-space-4) * 2)",
  );
  assert.equal(declaration(propertyMenu, "max-block-size"), "min(240px, 36vh)");
  assert.match(declaration(propertyMenu, "box-shadow"), /0 10px 24px/);

  const propertyAction = ruleBodyForSelector(
    css,
    'body.is-mobile .workspace-leaf-content[data-type=markdown] .metadata-property-value > .clickable-icon',
  );
  assert.equal(declaration(propertyAction, "border"), "0");
  assert.equal(declaration(propertyAction, "background-color"), "transparent");
  assert.equal(declaration(propertyAction, "box-shadow"), "none");

  const selectedSuggestion = ruleBody(
    css,
    'body.is-mobile .suggestion-container.mod-property-key .suggestion-item.is-selected',
  );
  assert.equal(declaration(selectedSuggestion, "outline"), "0");
  assert.equal(declaration(selectedSuggestion, "color"), "var(--pixel-cyan)");
  assert.match(
    declaration(selectedSuggestion, "background-color"),
    /var\(--pixel-cyan\) 8%/,
  );

  const navbarAction = ruleBody(
    css,
    "body.is-mobile .mobile-navbar-action .clickable-icon",
  );
  assert.equal(declaration(navbarAction, "min-block-size"), "var(--pixel-control-min)");
  assert.equal(declaration(navbarAction, "border"), "0");
  assert.equal(declaration(navbarAction, "box-shadow"), "none");

  const primaryAction = ruleBody(
    css,
    "body.is-mobile .mobile-navbar-action-new-tab .clickable-icon",
  );
  assert.equal(
    declaration(primaryAction, "background-color"),
    "var(--pixel-mobile-control-active)",
  );
  assert.equal(declaration(primaryAction, "color"), "var(--pixel-cyan)");
});

test("mobile left drawer uses a compact file-index type scale", async () => {
  const css = await readTheme();
  const mobile = combinedRuleBody(css, "body.is-mobile");

  assert.equal(declaration(mobile, "--pixel-mobile-tree-file-size"), "14px");
  assert.equal(declaration(mobile, "--pixel-mobile-tree-folder-size"), "14px");
  assert.equal(declaration(mobile, "--pixel-mobile-drawer-label-size"), "15px");
  assert.equal(declaration(mobile, "--pixel-mobile-drawer-meta-size"), "12px");

  const treeItem = ruleBody(
    css,
    "body.is-mobile .workspace-drawer.mod-left :is(.nav-file-title, .nav-folder-title)",
  );
  assert.equal(declaration(treeItem, "min-block-size"), "var(--pixel-control-min)");
  assert.equal(declaration(treeItem, "padding-block"), "var(--pixel-space-2)");

  const file = ruleBody(
    css,
    "body.is-mobile .workspace-drawer.mod-left .nav-file-title",
  );
  assert.equal(declaration(file, "font-size"), "var(--pixel-mobile-tree-file-size)");
  assert.equal(declaration(file, "line-height"), "1.45");

  const folder = ruleBody(
    css,
    "body.is-mobile .workspace-drawer.mod-left .nav-folder-title",
  );
  assert.equal(declaration(folder, "font-size"), "var(--pixel-mobile-tree-folder-size)");
  assert.equal(declaration(folder, "line-height"), "1.45");

  const treeLabel = ruleBody(
    css,
    "body.is-mobile .workspace-drawer.mod-left :is(.nav-file-title-content, .nav-folder-title-content)",
  );
  assert.equal(declaration(treeLabel, "overflow"), "hidden");
  assert.equal(declaration(treeLabel, "text-overflow"), "ellipsis");
  assert.equal(declaration(treeLabel, "white-space"), "nowrap");

  const activeFile = ruleBody(
    css,
    "body.is-mobile .workspace-drawer.mod-left .nav-file-title:is(.is-active, .is-selected)",
  );
  assert.equal(
    declaration(activeFile, "background-color"),
    "var(--pixel-mobile-control-active)",
  );
  assert.equal(declaration(activeFile, "color"), "var(--pixel-cyan)");
  assert.equal(declaration(activeFile, "border-inline-start-color"), "transparent");
  assert.equal(declaration(activeFile, "box-shadow"), "inset 4px 0 0 var(--pixel-cyan)");

  const vaultName = ruleBody(
    css,
    "body.is-mobile .workspace-drawer.mod-left .workspace-drawer-header-name-text",
  );
  assert.equal(declaration(vaultName, "font-size"), "16px");

  const toolbarButton = ruleBody(
    css,
    "body.is-mobile .workspace-drawer.mod-left .nav-action-button",
  );
  assert.equal(declaration(toolbarButton, "border"), "0");
  assert.equal(declaration(toolbarButton, "background"), "transparent");
  assert.equal(declaration(toolbarButton, "box-shadow"), "none");

  const drawerHeader = ruleBody(
    css,
    "body.is-mobile .workspace-drawer.mod-left .workspace-drawer-header",
  );
  assert.equal(declaration(drawerHeader, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(drawerHeader, "box-shadow"), "none");
});

test("M1 adds no custom gestures, hover dependencies, or fake controls", async () => {
  const css = await readTheme();
  const mobileRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((match) =>
      match[1]
        .split(",")
        .some((selector) => selector.trim().startsWith("body.is-mobile")),
    );
  const mobileSelectors = mobileRules.map((match) => match[1]).join("\n");
  const mobileDeclarations = mobileRules.map((match) => match[2]).join("\n");
  const mobileSource = `${mobileSelectors}\n${mobileDeclarations}`;

  assert.doesNotMatch(mobileSource, /edge-swipe|touch-action|overscroll-behavior/);
  assert.doesNotMatch(mobileSelectors, /body\.is-mobile[^{}]*:hover/);
  assert.doesNotMatch(mobileSelectors, /body\.is-mobile[^{}]*::(?:before|after)/);
  assert.doesNotMatch(mobileDeclarations, /(?:^|;)\s*display:\s*none/m);
});

test("M1 drawer motion follows preferences and forced colors", async () => {
  const css = await readTheme();
  const mobileCss = css.slice(css.indexOf("--mobile-sidebar-width"));
  const reduced = atRuleBody(mobileCss, "@media (prefers-reduced-motion: reduce)");
  const drawer = ruleBodyForSelector(reduced, "body.is-mobile .workspace-drawer");
  assert.equal(declaration(drawer, "transition-duration"), "0ms");
  assert.equal(declaration(drawer, "animation"), "none");

  const button = ruleBodyForSelector(reduced, "body.is-mobile button");
  assert.equal(declaration(button, "transition-duration"), "0ms");
  assert.equal(declaration(button, "animation"), "none");

  const forced = atRuleBody(mobileCss, "@media (forced-colors: active)");
  const forcedDrawer = ruleBodyForSelector(forced, "body.is-mobile .workspace-drawer");
  assert.equal(declaration(forcedDrawer, "border-color"), "canvastext");
  assert.equal(declaration(forcedDrawer, "background-color"), "canvas");
  assert.equal(declaration(forcedDrawer, "box-shadow"), "none");
});
