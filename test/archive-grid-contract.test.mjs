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
  const before = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header::before",
  );
  const after = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-tab-header::after",
  );
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
  assert.equal(declaration(before, "box-shadow"), "none");
  assert.equal(declaration(after, "content"), "none");
  assert.equal(declaration(after, "box-shadow"), "none");
  assert.equal(declaration(activeAfter, "display"), "block");
  assert.equal(declaration(activeAfter, "content"), '""');
  assert.equal(declaration(activeAfter, "inset"), "auto 15px 0");
  assert.equal(declaration(activeAfter, "height"), "4px");
  assert.match(
    declaration(activeAfter, "background"),
    /^repeating-linear-gradient\(90deg, var\(--pixel-cyan\) 0 12px, transparent 12px 16px\)$/,
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
  assert.equal(declaration(tab, "border-radius"), "6px 6px 0 0");
  assert.equal(declaration(tab, "overflow"), "hidden");
  assert.equal(
    declaration(active, "border-color"),
    "var(--pixel-line)",
  );
  assert.equal(declaration(newTab, "inline-size"), "44px");
  assert.equal(declaration(newTab, "min-inline-size"), "44px");
  assert.equal(declaration(newTab, "border-radius"), "6px");
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
  const toolsAfter = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] .nav-header::after",
  );
  const toolButton = ruleBodyForSelector(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-left-split .workspace-leaf-content[data-type=file-explorer] .nav-header .clickable-icon",
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
  assert.equal(declaration(row, "border-radius"), "5px");
  assert.equal(declaration(active, "background-color"), "var(--pixel-nav-label)");
  assert.equal(declaration(active, "box-shadow"), "none");
  assert.equal(declaration(toolsAfter, "content"), '"a-01"');
  assert.equal(declaration(toolButton, "border-radius"), "6px");
  assert.equal(declaration(activeBefore, "inline-size"), "4px");
  assert.equal(declaration(activeBefore, "background-color"), "var(--pixel-cyan)");
  assert.equal(declaration(activeAfter, "inline-size"), "5px");
  assert.equal(declaration(activeAfter, "block-size"), "5px");
  assert.equal(
    declaration(activeAfter, "box-shadow"),
    "-7px 0 0 color-mix(in srgb, var(--pixel-cyan) 50%, transparent)",
  );
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
