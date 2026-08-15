import assert from "node:assert/strict";
import test from "node:test";
import {
  atRuleBody,
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

const emptyRoot =
  'body .workspace.workspace .workspace-split.mod-root .workspace-leaf-content[data-type=empty]';

test("the empty root tab exposes calibrated handheld palettes in Light and Dark", async () => {
  const css = await readTheme();
  const light = ruleBody(css, ".theme-light");
  const dark = ruleBody(css, ".theme-dark");

  assert.equal(declaration(light, "--pixel-handheld-shell"), "#d9ded9");
  assert.equal(declaration(light, "--pixel-handheld-screen"), "#b7c39a");
  assert.equal(declaration(light, "--pixel-handheld-screen-ink"), "#26382e");
  assert.equal(declaration(dark, "--pixel-handheld-shell"), "#293840");
  assert.equal(declaration(dark, "--pixel-handheld-screen"), "#91a574");
  assert.equal(declaration(dark, "--pixel-handheld-screen-ink"), "#17251d");
  assert.equal(declaration(dark, "--pixel-handheld-label"), "#8fa2ad");
});

test("the empty root tab forms one bounded Game Boy shell around native actions", async () => {
  const css = await readTheme();
  const shell = ruleBody(css, `${emptyRoot} .empty-state-container`);
  const lcd = ruleBody(css, `${emptyRoot} .empty-state-action-list`);
  const action = ruleBody(css, `${emptyRoot} .empty-state-action`);

  assert.equal(declaration(shell, "position"), "relative");
  assert.equal(declaration(shell, "isolation"), "isolate");
  assert.equal(declaration(shell, "min-block-size"), "421px");
  assert.equal(
    declaration(shell, "border"),
    "4px solid var(--pixel-handheld-bezel)",
  );
  assert.equal(
    declaration(shell, "background-color"),
    "var(--pixel-handheld-shell)",
  );
  assert.equal(
    declaration(shell, "box-shadow"),
    "7px 8px 0 var(--pixel-shadow-color)",
  );

  assert.equal(declaration(lcd, "display"), "grid");
  assert.equal(
    declaration(lcd, "background-color"),
    "var(--pixel-handheld-screen)",
  );
  assert.equal(
    declaration(lcd, "border"),
    "4px solid var(--pixel-handheld-screen-ink)",
  );
  assert.equal(declaration(action, "position"), "relative");
  assert.equal(declaration(action, "z-index"), "1");
  assert.equal(declaration(action, "background"), "transparent");
});

test("handheld decoration is semantic, inert, and scoped away from generic empty states", async () => {
  const css = await readTheme();
  const titleBefore = ruleBody(css, `${emptyRoot} .empty-state-title::before`);
  const edition = ruleBody(css, `${emptyRoot} .empty-state::before`);
  const lcdStatus = ruleBody(css, `${emptyRoot} .empty-state-action-list::before`);
  const identity = ruleBody(css, `${emptyRoot} .empty-state-action-list::after`);
  const dpad = ruleBody(css, `${emptyRoot} .empty-state-container::before`);
  const controls = ruleBody(css, `${emptyRoot} .empty-state-container::after`);
  const bButton = ruleBody(
    css,
    `${emptyRoot} .empty-state-action:nth-child(1)::after`,
  );
  const aButton = ruleBody(
    css,
    `${emptyRoot} .empty-state-action:nth-child(2)::after`,
  );
  const systemLabels = ruleBody(
    css,
    `${emptyRoot} .empty-state-action:nth-child(3)::after`,
  );

  assert.equal(declaration(titleBefore, "content"), '"pocket note"');
  assert.equal(declaration(lcdStatus, "content"), '"select mode"');
  assert.equal(
    declaration(identity, "content"),
    '"pixel boy"',
  );
  assert.equal(declaration(edition, "content"), '"obsidian edition"');
  assert.equal(declaration(edition, "font-size"), "6px");
  assert.equal(declaration(edition, "pointer-events"), "none");
  assert.equal(declaration(dpad, "pointer-events"), "none");
  assert.equal(declaration(dpad, "inset-block-end"), "59px");
  assert.equal(declaration(controls, "content"), '""');
  assert.equal(declaration(controls, "inline-size"), "230px");
  assert.equal(declaration(controls, "pointer-events"), "none");
  assert.equal(declaration(bButton, "content"), '"b"');
  assert.equal(declaration(bButton, "inset-inline-start"), "168px");
  assert.equal(declaration(aButton, "content"), '"a"');
  assert.equal(declaration(aButton, "inset-inline-start"), "216px");
  assert.equal(
    declaration(systemLabels, "content"),
    '"select          start"',
  );

  const genericEmpty = ruleBodyForSelector(css, ".empty-state-container");
  assert.equal(
    declaration(genericEmpty, "border"),
    "var(--pixel-border-control) dashed var(--pixel-border-meaningful)",
  );
});

test("the handheld contracts for narrow screens and forced colors", async () => {
  const css = await readTheme();
  const narrow = atRuleBody(css, "@media (max-width: 520px)");
  const forced = atRuleBody(css, "@media (forced-colors: active)");

  assert.match(narrow, /inline-size:\s*min\(350px, (?:calc\()?100vw - 28px\)?\)/);
  assert.match(narrow, /min-block-size:\s*411px/);
  const forcedTheme = ruleBodyForSelector(forced, ".theme-light");
  assert.equal(declaration(forcedTheme, "--pixel-handheld-shell"), "canvas");
  assert.equal(
    declaration(forcedTheme, "--pixel-handheld-screen-ink"),
    "canvastext",
  );
  assert.equal(
    declaration(forcedTheme, "--pixel-handheld-label"),
    "canvastext",
  );
});
