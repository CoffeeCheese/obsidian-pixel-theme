import assert from "node:assert/strict";
import test from "node:test";
import { declaration, readTheme, ruleBodyForSelector } from "../test-support/theme-css.mjs";

const bodies = (css, selector) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter(match => match[1].split(",").map(value => value.trim()).includes(selector))
  .map(match => match[2]);

test("desktop navigation distinguishes hover from drag without resizing native hit areas", async () => {
  const css = await readTheme();
  const thumb = "body.styled-scrollbars:not(.is-mobile) ::-webkit-scrollbar-thumb";
  const handle = "body:not(.is-mobile) .workspace-leaf-resize-handle";
  for (const selector of [thumb, handle]) {
    const hover = ruleBodyForSelector(css, `${selector}:hover`);
    assert.match(declaration(hover, "background-color"), /color-mix/);
    const active = ruleBodyForSelector(css, selector + (selector === thumb ? ":active" : ".is-active"));
    assert.equal(declaration(active, "background-color"), "var(--pixel-cyan)");
    for (const body of [hover, active]) {
      assert.doesNotMatch(body, /(?:width|height|size|position|transform|padding|margin):/);
    }
    assert.match(bodies(css, selector + (selector === thumb ? ":active" : ".is-active")).at(-1), /Highlight/);
  }
  assert.equal(declaration(ruleBodyForSelector(css, `${handle}.is-active`), "transition-duration"), "0ms");
});

test("long reading links and inline code wrap without changing code blocks or normal word boundaries", async () => {
  const css = await readTheme();
  for (const link of ["internal-link", "external-link"]) {
    const body = bodies(css, `.markdown-rendered a.${link}`).find(b => b.includes("overflow-wrap"));
    assert.ok(body);
    assert.equal(declaration(body, "overflow-wrap"), "anywhere");
    assert.equal(declaration(body, "word-break"), "normal");
  }
  const code = ruleBodyForSelector(css, ".markdown-rendered :not(pre) > code");
  assert.equal(declaration(code, "white-space"), "break-spaces");
  assert.equal(declaration(code, "overflow-wrap"), "anywhere");
  assert.equal(declaration(code, "line-height"), "inherit");
  assert.equal(declaration(code, "box-decoration-break"), "clone");
  for (const selector of [".markdown-rendered mark", ".markdown-source-view.mod-cm6 .cm-highlight"]) {
    assert.equal(declaration(ruleBodyForSelector(css, selector), "box-decoration-break"), "clone");
  }
});

test("long desktop commands leave icons and shortcut hints intact while counters use stable digits", async () => {
  const css = await readTheme();
  const title = ruleBodyForSelector(css, "body:not(.is-mobile) .menu:not(.mod-tab-list) .menu-item-title");
  assert.equal(declaration(title, "white-space"), "normal");
  assert.equal(declaration(title, "overflow-wrap"), "anywhere");
  assert.equal(declaration(title, "min-inline-size"), "0");
  const icon = ruleBodyForSelector(css, "body:not(.is-mobile) .menu .menu-item-icon");
  assert.equal(declaration(icon, "flex-shrink"), "0");
  assert.equal(declaration(icon, "align-items"), "center");
  const shortcut = ruleBodyForSelector(css, "body:not(.is-mobile) .prompt .suggestion-hotkey");
  assert.equal(declaration(shortcut, "white-space"), "nowrap");
  assert.equal(declaration(shortcut, "flex-shrink"), "0");
  for (const selector of [".nav-file-tag", ".tree-item-flair", ".tag-pane-tag-count"]) {
    const body = ruleBodyForSelector(css, selector);
    assert.equal(declaration(body, "font-variant-numeric"), "tabular-nums");
    assert.equal(declaration(body, "flex-shrink"), "0");
  }
});
