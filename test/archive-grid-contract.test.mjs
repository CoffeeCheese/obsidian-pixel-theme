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

  assert.equal(declaration(workspace, "gap"), "0");
  assert.equal(declaration(workspace, "padding"), "0");
  assert.equal(declaration(workspace, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(workspace, "background-size"), "4px 4px");
  assert.equal(declaration(sidePane, "border"), "0");
  assert.equal(declaration(sidePane, "box-shadow"), "none");
});

test("H5 Archive Grid joins the navigation dock to the reader without an active cyan divider", async () => {
  const css = await readTheme();
  const readerLeadingEdgeSignal = ruleBody(
    css,
    "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-leaf.mod-active::after",
  );

  assert.equal(declaration(readerLeadingEdgeSignal, "content"), "none");
});

test("H5 Archive Grid maps native root tabs to the prototype cartridge rail", async () => {
  const css = await readTheme();
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
