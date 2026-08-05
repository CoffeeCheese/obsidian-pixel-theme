import assert from "node:assert/strict";
import test from "node:test";
import { declaration, readTheme, ruleBody } from "../test-support/theme-css.mjs";

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
