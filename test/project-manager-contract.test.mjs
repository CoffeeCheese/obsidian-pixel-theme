import assert from "node:assert/strict";
import test from "node:test";
import {
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

const modal = "body:not(.is-mobile) .modal.pm-modal--task";

test("Project Manager task editor uses a compact macOS sheet with a Pixel edge", async () => {
  const css = await readTheme();
  const sheet = ruleBody(css, modal);

  assert.equal(declaration(sheet, "inline-size"), "min(760px, 100vw - 48px)");
  assert.equal(declaration(sheet, "max-block-size"), "min(86vh, 820px)");
  assert.equal(
    declaration(sheet, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-pm-edge)",
  );
  assert.match(declaration(sheet, "box-shadow"), /2px 2px 0 var\(--pixel-shadow-color\)/);
  assert.match(declaration(sheet, "box-shadow"), /0 20px 52px/);
  assert.equal(declaration(sheet, "font-size"), "13px");
});

test("Project Manager uses only its own close action", async () => {
  const css = await readTheme();
  const nativeChrome = ruleBodyForSelector(
    css,
    `${modal} > .modal-header-button`,
  );
  assert.equal(declaration(nativeChrome, "display"), "none");

  const action = ruleBody(
    css,
    `${modal} .pm-te-header-btn.clickable-icon`,
  );
  assert.equal(declaration(action, "inline-size"), "28px");
  assert.equal(declaration(action, "block-size"), "28px");
  assert.equal(declaration(action, "box-shadow"), "none");
});

test("Project Manager long titles and dense properties stay readable", async () => {
  const css = await readTheme();
  const title = ruleBody(css, `${modal} textarea.pm-te-title`);
  assert.equal(declaration(title, "border"), "0");
  assert.equal(declaration(title, "box-shadow"), "none");
  assert.equal(declaration(title, "font-size"), "19px");
  assert.equal(declaration(title, "line-height"), "1.42");

  const grid = ruleBody(css, `${modal} .pm-prop-grid`);
  assert.equal(
    declaration(grid, "grid-template-columns"),
    "repeat(2, minmax(0, 1fr))",
  );

  const row = ruleBody(css, `${modal} .pm-prop-grid .pm-prop-row`);
  assert.equal(
    declaration(row, "grid-template-columns"),
    "92px minmax(0, 1fr)",
  );

  const inlineControl = ruleBodyForSelector(
    css,
    `${modal} button.pm-prop-inline`,
  );
  assert.equal(declaration(inlineControl, "min-block-size"), "27px");
  assert.equal(
    declaration(inlineControl, "border"),
    "var(--pixel-border-decoration) solid transparent",
  );
  assert.equal(declaration(inlineControl, "box-shadow"), "none");
  assert.equal(declaration(inlineControl, "font-size"), "12.5px");
});

test("Project Manager collapses its property grid in narrow desktop windows", async () => {
  const css = await readTheme();
  const media = css.slice(css.indexOf("@media (max-width: 720px)"));
  const grid = ruleBody(media, `${modal} .pm-prop-grid`);
  assert.equal(declaration(grid, "grid-template-columns"), "minmax(0, 1fr)");
});
