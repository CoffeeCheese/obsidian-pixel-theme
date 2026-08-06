import assert from "node:assert/strict";
import test from "node:test";
import {
  declaration,
  matchingRuleBodies,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

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

  assert.equal(declaration(readerLeadingEdgeSignal, "content"), "none");
  assert.equal(declaration(navigationLeadingEdgeSignal, "content"), "none");
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

test("H5 Archive Grid maps native root tabs to the prototype cartridge rail", async () => {
  const css = await readTheme();
  const contextRail = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-right-split .workspace-tab-header-container",
  );
  const title = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header-inner-title",
  );
  const active = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header.is-active",
  );
  const beforeSelector =
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header::before";
  const afterSelector =
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header::after";
  const beforeRules = matchingRuleBodies(css, beforeSelector);
  const afterRules = matchingRuleBodies(css, afterSelector);
  const before = beforeRules.at(-1);
  const after = afterRules[0];
  const tabSignal = afterRules.at(-1);
  const activeAfter = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header.is-active::after",
  );

  assert.equal(declaration(contextRail, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(title, "font-family"), "var(--pixel-font-identity)");
  assert.equal(declaration(title, "font-size"), "10px");
  assert.equal(
    declaration(active, "background-color"),
    "color-mix(in srgb, var(--pixel-canvas) 45%, var(--pixel-paper))",
  );
  assert.equal(declaration(active, "background-image"), "none");
  assert.equal(declaration(before, "content"), "none");
  assert.equal(declaration(after, "box-shadow"), "none");
  assert.equal(declaration(tabSignal, "display"), "block");
  assert.equal(declaration(tabSignal, "content"), '""');
  assert.equal(declaration(tabSignal, "inset"), "auto 15px 0");
  assert.equal(declaration(tabSignal, "height"), "3px");
  assert.equal(declaration(tabSignal, "background"), "var(--pixel-cyan)");
  assert.equal(declaration(tabSignal, "opacity"), "0");
  assert.equal(declaration(tabSignal, "transform"), "scalex(0.45)");
  assert.equal(declaration(activeAfter, "opacity"), "1");
  assert.equal(declaration(activeAfter, "transform"), "scalex(1)");
  assert.match(
    declaration(tabSignal, "transition"),
    /transform var\(--pixel-motion-surface\) var\(--pixel-ease-out\)/,
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
  assert.equal(declaration(tab, "inline-size"), "180px");
  assert.equal(declaration(tab, "min-inline-size"), "180px");
  assert.equal(declaration(tab, "max-inline-size"), "180px");
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
  const active = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] .nav-file-title.is-active",
  );
  const toolButton = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] .nav-header .clickable-icon",
  );
  const rowSignal = ruleBody(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] :is(.nav-file-title, .nav-folder-title)::before",
  );
  const activeBefore = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] .nav-file-title.is-active::before",
  );
  const activeAfter = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] .nav-file-title.is-active::after",
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
  assert.equal(declaration(active, "background-color"), "var(--pixel-nav-label)");
  assert.equal(declaration(active, "box-shadow"), "none");
  // The instrument strip keeps only the native toolbar; the prototype
  // part-number label that sat in its bottom-right corner is removed.
  assert.ok(
    !/content:\s*"a-01"/i.test(css),
    "compiled theme.css must not render the A-01 part-number label",
  );
  assert.equal(declaration(toolButton, "border-radius"), "var(--pixel-radius)");
  assert.equal(declaration(rowSignal, "inline-size"), "4px");
  assert.equal(declaration(rowSignal, "background-color"), "var(--pixel-cyan)");
  assert.equal(declaration(rowSignal, "opacity"), "0");
  assert.equal(declaration(rowSignal, "transform"), "translatex(-4px)");
  assert.equal(declaration(activeBefore, "opacity"), "1");
  assert.equal(declaration(activeBefore, "transform"), "translatex(0)");
  assert.equal(declaration(activeAfter, "content"), "none");
});

test("H5 Archive Grid keeps the native file-header chain left aligned and prototype-sized", async () => {
  const css = await readTheme();
  const container = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .view-header-title-container",
  );
  const chain = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .view-header-title-parent",
  );
  const current = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .view-header-title",
  );

  assert.equal(declaration(container, "justify-content"), "flex-start");
  assert.equal(declaration(chain, "gap"), "7px");
  assert.equal(declaration(chain, "font-size"), "11px");
  assert.equal(declaration(current, "color"), "var(--pixel-text)");
  assert.equal(declaration(current, "font-size"), "11px");
  assert.equal(declaration(current, "font-weight"), "450");
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
  assert.equal(declaration(dark, "--pixel-line"), "#2b3d47");
  assert.equal(declaration(dark, "--pixel-line-strong"), "#344854");
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
  const view = ruleBodyForSelector(css, `${scope} .markdown-source-view`);
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
  const row = ruleBodyForSelector(css, `${scope} .metadata-property`);
  const key = ruleBodyForSelector(css, `${scope} .metadata-property-key`);
  const value = ruleBodyForSelector(css, `${scope} .metadata-property-value`);
  const propertyIcon = ruleBodyForSelector(css, `${scope} .metadata-property-icon`);
  const propertyIconGlyph = ruleBodyForSelector(
    css,
    `${scope} .metadata-property-icon::before`,
  );
  const textIconGlyph = ruleBodyForSelector(
    css,
    `${scope} .metadata-property:has(.metadata-property-value[data-property-type=text]) .metadata-property-icon::before`,
  );
  const numberIconGlyph = ruleBodyForSelector(
    css,
    `${scope} .metadata-property:has(.metadata-property-value[data-property-type=number]) .metadata-property-icon::before`,
  );
  const dateIconGlyph = ruleBodyForSelector(
    css,
    `${scope} .metadata-property:has(.metadata-property-value[data-property-type=date]) .metadata-property-icon::before`,
  );
  const tagsIconGlyph = ruleBodyForSelector(
    css,
    `${scope} .metadata-property:has(.metadata-property-value[data-property-type=tags]) .metadata-property-icon::before`,
  );
  const propertyIconSvg = ruleBodyForSelector(
    css,
    `${scope} .metadata-property-icon svg`,
  );
  const focusedRow = ruleBodyForSelector(
    css,
    `${scope} .metadata-property:focus-within`,
  );
  const hoveredRow = ruleBodyForSelector(
    css,
    `${scope} .metadata-property:hover`,
  );
  const keyEditingRow = ruleBodyForSelector(
    css,
    `${scope} .metadata-property:has(.metadata-property-key:focus-within)`,
  );
  const focusedKey = ruleBodyForSelector(
    css,
    `${scope} .metadata-property-key:focus-within`,
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

  assert.equal(declaration(view, "container-type"), "inline-size");
  assert.equal(
    declaration(sheet, "--pixel-property-sheet-width"),
    "min(calc(100cqi - 56px), 820px)",
  );
  assert.equal(declaration(sheet, "inline-size"), "var(--pixel-property-sheet-width)");
  assert.equal(declaration(sheet, "margin-block-start"), "44px");
  assert.equal(declaration(heading, "gap"), "10px");
  assert.equal(declaration(heading, "font-family"), "var(--pixel-font-identity)");
  assert.equal(declaration(heading, "font-size"), "16px");
  assert.equal(declaration(heading, "font-weight"), "720");
  assert.equal(declaration(heading, "line-height"), "1.2");
  assert.equal(declaration(heading, "padding"), "4px");
  assert.equal(declaration(marker, "inline-size"), "6px");
  assert.equal(declaration(marker, "block-size"), "6px");
  assert.equal(declaration(marker, "position"), "static");
  assert.match(declaration(marker, "box-shadow"), /var\(--pixel-amber-text\)/);
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
  assert.equal(declaration(propertyIconGlyph, "content"), '"·"');
  assert.equal(declaration(textIconGlyph, "content"), '"≡"');
  assert.equal(declaration(numberIconGlyph, "content"), '"01"');
  assert.equal(declaration(dateIconGlyph, "content"), '"□"');
  assert.equal(declaration(tagsIconGlyph, "content"), '"◇"');
  assert.equal(declaration(propertyIconSvg, "inline-size"), "0");
  assert.equal(declaration(propertyIconSvg, "block-size"), "0");
  assert.equal(declaration(propertyIconSvg, "opacity"), "0");
  assert.equal(
    declaration(hoveredRow, "box-shadow"),
    "0 0 0 var(--pixel-border-decoration) var(--pixel-line)",
  );
  assert.equal(declaration(focusedRow, "outline"), "0");
  assert.equal(
    declaration(focusedRow, "box-shadow"),
    "0 0 0 var(--pixel-border-control) var(--pixel-line-strong)",
  );
  assert.equal(declaration(propertyInput, "min-block-size"), "28px");
  assert.equal(declaration(propertyInput, "padding"), "4px 8px");
  assert.equal(declaration(keyEditingRow, "padding-block-end"), "64px");
  assert.equal(
    declaration(focusedKey, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 8%, transparent)",
  );
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
});
