import assert from "node:assert/strict";
import test from "node:test";
import {
  declaration,
  matchingRuleBodies,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

function horizontalPixelPaintCenter(rule) {
  const start = Number.parseFloat(declaration(rule, "inset-inline-start"));
  const width = Number.parseFloat(declaration(rule, "inline-size"));
  const shadowOffsets = [
    ...declaration(rule, "box-shadow").matchAll(
      /(-?\d+(?:\.\d+)?)px\s+(?:-?\d+(?:\.\d+)?px|0)/g,
    ),
  ].map((match) => Number.parseFloat(match[1]));
  const minimumOffset = Math.min(0, ...shadowOffsets);
  const maximumOffset = Math.max(0, ...shadowOffsets);

  return start + (minimumOffset + maximumOffset + width) / 2;
}

test("H5 Archive Grid keeps the desktop workspace as one continuous paper plane", async () => {
  const css = await readTheme();
  const workspace = ruleBody(css, "body:not(.is-mobile) .workspace.workspace");
  const sidePane = ruleBody(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split:not(.is-sidedock-collapsed),\nbody:not(.is-mobile) .workspace.workspace .workspace-split.mod-right-split:not(.is-sidedock-collapsed)",
  );

  assert.equal(declaration(workspace, "--header-height"), "44px");
  assert.equal(declaration(workspace, "gap"), "0");
  assert.equal(declaration(workspace, "padding"), "0");
  assert.equal(declaration(workspace, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(workspace, "background-size"), "4px 4px");
  assert.equal(declaration(sidePane, "border"), "0");
  assert.equal(declaration(sidePane, "box-shadow"), "none");
});

test("H5 Archive Grid joins its workspace cabins without active cyan dividers", async () => {
  const css = await readTheme();
  const readerLeadingEdgeSignal = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-leaf.mod-active::after",
  );
  const navigationLeadingEdgeSignal = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf.mod-active::after",
  );
  const contextLeadingEdgeSignal = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-right-split .workspace-leaf.mod-active::after",
  );

  assert.equal(declaration(readerLeadingEdgeSignal, "content"), "none");
  assert.equal(declaration(navigationLeadingEdgeSignal, "content"), "none");
  assert.equal(declaration(contextLeadingEdgeSignal, "content"), "none");
});

test("H5 Archive Grid keeps the context toolbar free of vertical tab dividers", async () => {
  const css = await readTheme();
  const contextTab = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-right-split .workspace-tab-header",
  );

  assert.equal(declaration(contextTab, "border-inline-end"), "0");
});

test("H5 Archive Grid keeps the navigation toolbar free of vertical tab dividers", async () => {
  const css = await readTheme();
  const navigationTab = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-tab-header",
  );

  assert.equal(declaration(navigationTab, "border-inline-end"), "0");
});

test("H5 Archive Grid gives the context toolbar cool cyan interaction surfaces", async () => {
  const css = await readTheme();
  const hover = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-right-split .workspace-tab-header:not(.is-active):hover",
  );
  const active = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-right-split .workspace-tab-header.is-active",
  );

  assert.equal(
    declaration(hover, "background-color"),
    "var(--pixel-context-control-hover)",
  );
  assert.equal(declaration(hover, "color"), "var(--pixel-text)");
  assert.equal(
    declaration(active, "background-color"),
    "var(--pixel-context-control-active)",
  );
  assert.equal(
    declaration(active, "box-shadow"),
    "inset 0 -4px 0 var(--pixel-cyan)",
  );
});

test("H5 Archive Grid gives root tabs the H5 S1 cartridge geometry", async () => {
  const css = await readTheme();
  const rail = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header-container",
  );
  const tab = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header",
  );
  const active = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header.is-active",
  );
  const newTab = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header-new-tab",
  );

  assert.equal(declaration(rail, "gap"), "2px");
  assert.equal(declaration(tab, "inline-size"), "224px");
  assert.equal(declaration(tab, "min-inline-size"), "224px");
  assert.equal(declaration(tab, "max-inline-size"), "224px");
  assert.equal(
    declaration(tab, "border"),
    "var(--pixel-border-decoration) solid transparent",
  );
  assert.equal(declaration(tab, "border-block-end"), "0");
  assert.equal(
    declaration(tab, "border-radius"),
    "var(--pixel-radius-large) var(--pixel-radius-large) 0 0",
  );
  assert.equal(declaration(tab, "overflow"), "hidden");
  assert.equal(
    declaration(active, "border-color"),
    "var(--pixel-line)",
  );
  assert.equal(declaration(newTab, "inline-size"), "44px");
  assert.equal(declaration(newTab, "min-inline-size"), "44px");
  assert.equal(declaration(newTab, "border-radius"), "var(--pixel-radius)");
});

test("H5 Archive Grid keeps top-corner controls flush with the top bar", async () => {
  const css = await readTheme();
  const activeTab = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header.is-active",
  );
  const rightToggle = ruleBodyForSelector(
    css,
    "body:not(.is-mobile).mod-macos.is-hidden-frameless:not(.is-popout-window) .workspace.workspace .sidebar-toggle-button.mod-right",
  );

  assert.equal(
    declaration(activeTab, "background-color"),
    "var(--pixel-paper)",
  );
  assert.equal(
    declaration(rightToggle, "background-color"),
    "var(--pixel-paper)",
  );
});

test("H5 Archive Grid removes the native inner tab divider but keeps its activity rail", async () => {
  const css = await readTheme();
  const nativeDivider = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header-inner::after",
  );
  const activityRail = matchingRuleBodies(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header::after",
  ).find((body) => /(?:^|[;\n])\s*content:/.test(body));

  assert.equal(declaration(nativeDivider, "content"), "none");
  assert.ok(activityRail);
  assert.equal(declaration(activityRail, "content"), '\"\"');
  assert.equal(declaration(activityRail, "background"), "var(--pixel-cyan)");
});

test("H5 Archive Grid gives mixed-language document identity a readable hierarchy", async () => {
  const css = await readTheme();
  const tabTitle = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header-inner-title",
  );
  const titleContainer = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .view-header-title-container",
  );
  const path = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .view-header-title-parent",
  );
  const breadcrumb = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .view-header-breadcrumb",
  );
  const title = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .view-header-title",
  );

  assert.equal(declaration(tabTitle, "font-family"), "var(--pixel-font-text)");
  assert.equal(declaration(tabTitle, "font-size"), "14px");
  assert.equal(declaration(tabTitle, "font-weight"), "600");
  assert.equal(declaration(tabTitle, "line-height"), "20px");
  assert.equal(declaration(titleContainer, "gap"), "8px");
  assert.equal(declaration(path, "font-family"), "var(--pixel-font-identity)");
  assert.equal(declaration(path, "font-size"), "12px");
  assert.equal(declaration(path, "line-height"), "16px");
  assert.equal(declaration(breadcrumb, "font-size"), "12px");
  assert.equal(declaration(title, "font-family"), "var(--pixel-font-text)");
  assert.equal(declaration(title, "font-size"), "14px");
  assert.equal(declaration(title, "font-weight"), "600");
  assert.equal(declaration(title, "line-height"), "20px");
});

test("H5 Archive Grid maps the native file browser to the H5 S1 navigation cabin", async () => {
  const css = await readTheme();
  const tools = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] .nav-header",
  );
  const list = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] .nav-files-container",
  );
  const row = ruleBody(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] :is(.nav-file-title, .nav-folder-title)",
  );
  const active = ruleBody(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] .nav-file-title:is(.is-active, .is-selected)",
  );
  const toolButton = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] .nav-header .clickable-icon",
  );
  const rowSignal = ruleBody(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] :is(.nav-file-title, .nav-folder-title)::before",
  );
  const activeBefore = ruleBody(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] .nav-file-title:is(.is-active, .is-selected)::before",
  );
  const activeAfter = ruleBody(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] .nav-file-title:is(.is-active, .is-selected)::after",
  );
  const hover = ruleBody(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] :is(.nav-file-title, .nav-folder-title):not(.is-active):not(.is-selected):hover",
  );

  assert.equal(declaration(tools, "min-block-size"), "44px");
  assert.equal(declaration(tools, "padding"), "0 9px");
  // The 44px instrument strip must center its 32px toolbar vertically,
  // otherwise the buttons stick to the top edge and leave dead space below.
  assert.equal(declaration(tools, "display"), "grid");
  assert.equal(declaration(tools, "align-items"), "center");
  assert.equal(
    declaration(tools, "border-block-end"),
    "var(--pixel-border-decoration) solid var(--pixel-line)",
  );
  assert.equal(
    declaration(tools, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 8%, var(--pixel-paper))",
  );
  assert.match(
    declaration(tools, "background-image"),
    /^repeating-linear-gradient\(90deg, color-mix\(in srgb, var\(--pixel-cyan\) 18%, transparent\) 0 1px, transparent 1px 8px\)$/,
  );
  assert.equal(declaration(list, "padding"), "7px 8px 24px");
  assert.equal(declaration(row, "border-radius"), "var(--pixel-radius)");
  assert.doesNotMatch(row, /background-image\s*:/);
  assert.match(declaration(row, "transition"), /var\(--pixel-ease-out\)/);
  assert.doesNotMatch(
    declaration(row, "transition"),
    /background-color|border-color|(?<!-)color/,
    "controller paint must not interpolate from the ordinary row state",
  );
  assert.equal(declaration(active, "transform"), "translatex(2px)");
  assert.equal(declaration(active, "background-color"), "var(--pixel-nav-controller)");
  assert.match(declaration(active, "box-shadow"), /^inset 0 -2px 0/);
  // The instrument strip keeps only the native toolbar; the prototype
  // part-number label that sat in its bottom-right corner is removed.
  assert.ok(
    !/content:\s*"a-01"/i.test(css),
    "compiled theme.css must not render the A-01 part-number label",
  );
  assert.equal(declaration(toolButton, "border-radius"), "var(--pixel-radius)");
  assert.equal(declaration(rowSignal, "inline-size"), "11px");
  assert.equal(declaration(rowSignal, "opacity"), "0");
  assert.equal(declaration(rowSignal, "transform"), "translatey(-50%)");
  assert.equal(declaration(activeBefore, "opacity"), "0.68");
  assert.match(declaration(activeBefore, "background"), /linear-gradient/);
  assert.equal(declaration(activeAfter, "inline-size"), "24px");
  assert.match(declaration(activeAfter, "background"), /^radial-gradient/);
  assert.equal(declaration(hover, "transform"), "translatex(2px)");
  assert.doesNotMatch(hover, /box-shadow\s*:/);
});

test("H5 Archive Grid leaves global status-bar geometry to the workspace shell", async () => {
  const css = await readTheme();
  const statusBarRules = matchingRuleBodies(
    css,
    "body:not(.is-mobile) .status-bar",
  );

  assert.equal(
    statusBarRules.length,
    1,
    "a later status-bar rule can stretch the fixed bar across the side-dock footer",
  );
});

test("H5 Archive Grid exposes the prototype's subtle and structural line roles", async () => {
  const css = await readTheme();
  const light = ruleBody(css, ".theme-light");
  const dark = ruleBody(css, ".theme-dark");

  assert.equal(declaration(light, "--pixel-line"), "#d2dde2");
  assert.equal(declaration(light, "--pixel-line-strong"), "#afc0ca");
  assert.equal(declaration(light, "--pixel-nav-label"), "#dcebed");
  assert.equal(declaration(light, "--pixel-nav-controller"), "#e3eef0");
  assert.equal(declaration(light, "--pixel-nav-controller-edge"), "#a9c3c8");
  assert.equal(declaration(dark, "--pixel-line"), "#2b3d47");
  assert.equal(declaration(dark, "--pixel-line-strong"), "#344854");
  assert.equal(declaration(dark, "--pixel-nav-controller"), "#20343c");
  assert.equal(declaration(dark, "--pixel-nav-controller-edge"), "#44656c");
});

test("H5 Archive Grid keeps native controls and metadata light instead of cartridge-like", async () => {
  const css = await readTheme();
  const control = ruleBody(
    css,
    "body:not(.is-mobile) .workspace.workspace .clickable-icon",
  );
  const metadata = ruleBody(
    css,
    "body:not(.is-mobile) .workspace.workspace .metadata-property",
  );

  assert.equal(declaration(control, "border"), "0");
  assert.equal(declaration(control, "background-color"), "transparent");
  assert.equal(declaration(control, "box-shadow"), "none");
  assert.equal(declaration(metadata, "border"), "0");
  assert.equal(
    declaration(metadata, "border-block-end"),
    "var(--pixel-border-decoration) solid var(--pixel-line)",
  );
});

test("H5 Archive Grid reproduces the prototype property sheet in the central reader", async () => {
  const css = await readTheme();
  const scope =
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-leaf-content[data-type=markdown]";
  const sheet = ruleBodyForSelector(css, `${scope} .metadata-container`);
  const heading = ruleBodyForSelector(css, `${scope} .metadata-properties-heading`);
  const marker = ruleBodyForSelector(
    css,
    `${scope} .metadata-properties-heading .collapse-indicator`,
  );
  const markerIcon = ruleBodyForSelector(
    css,
    `${scope} .metadata-properties-heading .collapse-indicator svg`,
  );
  const markerFace = ruleBodyForSelector(
    css,
    `${scope} .metadata-properties-heading .collapse-indicator::before`,
  );
  const markerFold = ruleBodyForSelector(
    css,
    `${scope} .metadata-properties-heading .collapse-indicator::after`,
  );
  const collapsedMarker = ruleBodyForSelector(
    css,
    `${scope} .metadata-properties-heading.is-collapsed .collapse-indicator`,
  );
  const collapsedMarkerFace = ruleBodyForSelector(
    css,
    `${scope} .metadata-properties-heading.is-collapsed .collapse-indicator::before`,
  );
  const focusedMarker = ruleBodyForSelector(
    css,
    `${scope} .metadata-properties-heading:focus-visible .collapse-indicator`,
  );
  const row = ruleBodyForSelector(css, `${scope} .metadata-property`);
  const key = ruleBodyForSelector(css, `${scope} .metadata-property-key`);
  const value = ruleBodyForSelector(css, `${scope} .metadata-property-value`);
  const propertyIcon = ruleBodyForSelector(css, `${scope} .metadata-property-icon`);
  const propertyIconSvg = ruleBodyForSelector(
    css,
    `${scope} .metadata-property-icon svg`,
  );
  const propertyIconSpacer = ruleBodyForSelector(
    css,
    `${scope} .metadata-property-icon::before`,
  );
  const focusedRow = ruleBodyForSelector(
    css,
    `${scope} .metadata-property:focus-within`,
  );
  const hoveredRow = ruleBodyForSelector(
    css,
    `${scope} .metadata-property:hover`,
  );
  const focusedKey = ruleBodyForSelector(
    css,
    `${scope} .metadata-property-key:focus-within`,
  );
  const focusedValue = ruleBodyForSelector(
    css,
    `${scope} .metadata-property-value:focus-within`,
  );
  const longText = ruleBodyForSelector(
    css,
    `${scope} .metadata-input-longtext`,
  );
  const dateAction = ruleBodyForSelector(
    css,
    `${scope} .metadata-property-value[data-property-type=date] > .clickable-icon`,
  );
  const dateInput = ruleBody(
    css,
    `${scope} .metadata-property-value :is(input[type=date], input[type=datetime-local])`,
  );
  const pill = ruleBodyForSelector(css, `${scope} .multi-select-pill`);
  const propertyInput = ruleBody(
    css,
    `${scope} .metadata-property :is(.metadata-property-key-input,\n.metadata-input,\n.metadata-input-text,\n.metadata-input-longtext,\n.metadata-link-inner,\n.multi-select-container)`,
  );
  const addButton = ruleBodyForSelector(css, `${scope} .metadata-add-button`);
  const hoveredAddButton = ruleBodyForSelector(
    css,
    `${scope} .metadata-add-button:hover`,
  );
  const propertyKeyMenuScope =
    "body:not(.is-mobile) .suggestion-container.mod-property-key";
  const propertyKeyMenu = ruleBodyForSelector(css, propertyKeyMenuScope);
  const propertyKeyMenuItem = ruleBodyForSelector(
    css,
    `${propertyKeyMenuScope} .suggestion-item`,
  );
  const selectedPropertyKeyMenuItem = ruleBodyForSelector(
    css,
    `${propertyKeyMenuScope} .suggestion-item.is-selected`,
  );

  assert.equal(declaration(sheet, "inline-size"), "100%");
  assert.equal(declaration(sheet, "max-inline-size"), "100%");
  assert.equal(declaration(sheet, "margin-inline-start"), "0");
  assert.equal(declaration(sheet, "transform"), "none");
  assert.equal(declaration(sheet, "margin-block-start"), "44px");
  assert.equal(declaration(heading, "gap"), "10px");
  assert.equal(declaration(heading, "font-family"), "var(--pixel-font-identity)");
  assert.equal(declaration(heading, "font-size"), "16px");
  assert.equal(declaration(heading, "font-weight"), "720");
  assert.equal(declaration(heading, "line-height"), "1.2");
  assert.equal(declaration(heading, "padding"), "4px");
  assert.equal(declaration(marker, "inline-size"), "24px");
  assert.equal(declaration(marker, "block-size"), "22px");
  assert.equal(declaration(marker, "position"), "relative");
  assert.equal(declaration(marker, "opacity"), "1");
  assert.equal(
    declaration(marker, "border"),
    "var(--pixel-border-control) solid var(--pixel-text-muted)",
  );
  assert.match(declaration(marker, "background"), /var\(--pixel-cyan\) 0 4px/);
  assert.match(declaration(markerFace, "box-shadow"), /6px 0 0 currentcolor/);
  assert.equal(horizontalPixelPaintCenter(markerFace), 12);
  assert.match(declaration(markerFold, "background-image"), /linear-gradient\(45deg/);
  assert.equal(declaration(collapsedMarker, "box-shadow"), "1px 1px 0 color-mix(in srgb, var(--pixel-cyan) 22%, var(--pixel-line))");
  assert.equal(declaration(collapsedMarkerFace, "inline-size"), "4px");
  assert.equal(declaration(collapsedMarkerFace, "box-shadow"), "6px 0 0 currentcolor");
  assert.equal(horizontalPixelPaintCenter(collapsedMarkerFace), 12);
  assert.equal(
    declaration(focusedMarker, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(focusedMarker, "outline-offset"), "2px");
  assert.equal(declaration(markerIcon, "opacity"), "0");
  assert.equal(declaration(row, "min-block-size"), "29px");
  assert.equal(declaration(row, "border"), "0");
  assert.equal(declaration(row, "border-radius"), "6px");
  assert.equal(declaration(key, "flex"), "0 0 165px");
  assert.equal(declaration(key, "font-family"), "var(--pixel-font-monospace)");
  assert.equal(declaration(key, "font-size"), "16px");
  assert.equal(declaration(value, "font-family"), "var(--pixel-font-text)");
  assert.equal(declaration(value, "font-size"), "16px");
  assert.equal(declaration(propertyIcon, "font-family"), "var(--pixel-font-monospace)");
  assert.doesNotMatch(css, /metadata-property:has\s*\(/);
  assert.equal(declaration(propertyIconSvg, "inline-size"), "16px");
  assert.equal(declaration(propertyIconSvg, "block-size"), "16px");
  assert.equal(declaration(propertyIconSvg, "opacity"), "1");
  assert.equal(declaration(propertyIconSpacer, "content"), "none");
  assert.equal(declaration(propertyIconSpacer, "display"), "none");
  assert.equal(
    declaration(hoveredRow, "box-shadow"),
    "0 0 0 var(--pixel-border-decoration) var(--pixel-line)",
  );
  assert.equal(
    declaration(hoveredRow, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 3%, transparent)",
  );
  assert.equal(declaration(focusedRow, "outline"), "0");
  assert.equal(
    declaration(focusedRow, "box-shadow"),
    "inset 2px 0 0 var(--pixel-cyan), 0 0 0 var(--pixel-border-decoration) var(--pixel-line-strong)",
  );
  assert.equal(
    declaration(focusedRow, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 5%, var(--pixel-paper))",
  );
  assert.equal(declaration(propertyInput, "min-block-size"), "28px");
  assert.equal(declaration(propertyInput, "padding"), "4px 8px");
  assert.equal(declaration(focusedKey, "min-block-size"), "28px");
  assert.equal(declaration(focusedKey, "padding-inline"), "0");
  assert.equal(declaration(focusedKey, "background-color"), "transparent");
  assert.equal(declaration(focusedKey, "box-shadow"), "none");
  assert.equal(declaration(focusedValue, "background-color"), "transparent");
  assert.equal(declaration(focusedValue, "box-shadow"), "none");
  assert.equal(declaration(longText, "white-space"), "normal");
  assert.equal(declaration(longText, "overflow-wrap"), "anywhere");
  assert.equal(declaration(dateInput, "padding-inline-start"), "24px");
  assert.equal(declaration(dateAction, "margin-inline-start"), "0");
  assert.equal(declaration(pill, "border-radius"), "6px");
  assert.equal(declaration(pill, "font-size"), "14px");
  assert.equal(declaration(pill, "line-height"), "14px");
  assert.equal(declaration(addButton, "font-size"), "14px");
  assert.equal(declaration(addButton, "line-height"), "1.5");
  assert.equal(
    declaration(hoveredAddButton, "background-color"),
    "var(--pixel-surface-secondary)",
  );
  assert.equal(
    declaration(propertyKeyMenu, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-line-strong)",
  );
  assert.equal(
    declaration(propertyKeyMenu, "border-radius"),
    "var(--pixel-radius-large)",
  );
  assert.equal(
    declaration(propertyKeyMenu, "box-shadow"),
    "0 10px 24px rgb(from var(--pixel-shadow-color) r g b/20%)",
  );
  assert.equal(declaration(propertyKeyMenuItem, "min-block-size"), "36px");
  assert.equal(
    declaration(propertyKeyMenuItem, "font-family"),
    "var(--pixel-font-text)",
  );
  assert.equal(declaration(propertyKeyMenuItem, "font-size"), "14px");
  assert.equal(declaration(selectedPropertyKeyMenuItem, "outline"), "0");
  assert.equal(
    declaration(selectedPropertyKeyMenuItem, "box-shadow"),
    "inset 2px 0 0 var(--pixel-cyan)",
  );
});
