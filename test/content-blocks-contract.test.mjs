import assert from "node:assert/strict";
import test from "node:test";
import { combinedRuleBody, declaration, readTheme, ruleBodyForSelector } from "../test-support/theme-css.mjs";

test("quotes and nested callouts use compact spacing without taking over native folding", async () => {
  const css = await readTheme();
  const rule = selector => ruleBodyForSelector(css, selector);
  assert.equal(declaration(rule(".markdown-rendered blockquote"), "padding-inline"), "var(--pixel-space-4)");
  assert.equal(declaration(rule(".callout-title-inner"), "overflow-wrap"), "anywhere");
  assert.equal(declaration(rule(".callout > .callout-title > .callout-fold"), "flex-shrink"), "0");
  assert.equal(declaration(rule(".callout > .callout-title > .callout-fold"), "margin-inline-start"), "auto");
  assert.equal(declaration(rule(".callout-content .callout"), "margin-block"), "var(--pixel-space-3)");
  assert.equal(declaration(rule(".callout-content > :last-child"), "margin-block-end"), "0");
  assert.match(rule(".callout.is-collapsible > .callout-title"), /var\(--pixel-motion-state\)/);
  assert.match(rule(".callout.is-collapsible > .callout-title:hover"), /rgb\(var\(--callout-color\)\) 8%/);
  assert.doesNotMatch(rule(".callout.is-collapsible > .callout-title"), /(?:height|transform|display|overflow):/);
  assert.equal(declaration(rule("body.is-mobile .callout.is-collapsible > .callout-title"), "min-block-size"), "44px");
  const surface = rule("body:not(.is-mobile) .workspace.workspace .callout");
  assert.match(surface, /rgb\(var\(--callout-color\)\) 6%/);
});

test("code scrolls independently of the visible native copy action and keeps mobile targets clear", async () => {
  const css = await readTheme();
  const rule = selector => ruleBodyForSelector(css, selector);
  const code = rule(".markdown-rendered pre > code");
  assert.equal(declaration(code, "overflow-x"), "auto");
  assert.equal(declaration(code, "border"), "0");
  assert.equal(declaration(code, "display"), "block");
  assert.equal(declaration(code, "white-space"), "var(--code-white-space)");
  assert.equal(declaration(code, "overscroll-behavior-inline"), "contain");
  const copy = 'body .markdown-rendered pre > button.copy-code-button:not(.clickable-icon):not(.mod-settings *)';
  const enabled = `${copy}:not(:disabled):not([aria-disabled=true])`;
  assert.equal(declaration(rule(copy), "display"), "inline-flex");
  assert.doesNotMatch(rule(copy), /(?:^|[;\n])\s*(?:position|inset|top|right|left|content):/);
  for (const state of ["", ":hover", ":active"]) {
    assert.equal(declaration(rule(enabled + state), "transform"), "none");
    assert.equal(declaration(rule(enabled + state), "box-shadow"), "none");
  }
  assert.match(rule(enabled), /var\(--pixel-motion-state\)/);
  assert.equal(declaration(combinedRuleBody(css, enabled + ":hover"), "border-style"), "dashed");
  assert.equal(declaration(combinedRuleBody(css, enabled + ":active"), "outline-offset"), "-3px");
  assert.match(rule(enabled + ":focus-visible"), /outline:.*var\(--pixel-cyan\)/);
  const mobile = rule(copy.replace("body ", "body.is-mobile "));
  assert.equal(declaration(mobile, "min-block-size"), "44px");
  assert.equal(declaration(mobile, "min-inline-size"), "44px");
  assert.equal(declaration(rule("body.is-mobile .markdown-rendered pre"), "padding-block-start"), "calc(var(--pixel-space-12) + var(--pixel-space-2))");
});

test("reading and live tables use restrained hover feedback without overriding native selections", async () => {
  const css = await readTheme();
  assert.equal(declaration(ruleBodyForSelector(css, ".markdown-rendered table"), "background-color"), "var(--table-background)");
  for (const selector of [".markdown-rendered tbody > tr:hover", ".markdown-source-view.mod-cm6 .cm-table-widget tbody > tr:hover"]) {
    const rule = ruleBodyForSelector(css, selector);
    assert.equal(declaration(rule, "background-color"), "var(--table-row-background-hover)");
    assert.doesNotMatch(rule, /(?:^|[;\n])\s*(?:color|transform|box-shadow|outline|border):/);
  }
});

test("desktop reading code gives native copy its own column without an empty title row", async () => {
  const css = await readTheme();
  const panel = ':where(body:not(.is-mobile)) .markdown-rendered pre';
  const rule = selector => ruleBodyForSelector(css, selector);
  assert.equal(declaration(rule(panel), "display"), "grid");
  assert.equal(declaration(rule(panel), "border-radius"), "0");
  assert.equal(declaration(rule(panel), "grid-template-columns"), "minmax(0, 1fr) auto");
  assert.equal(declaration(rule(panel), "overflow"), "visible");
  assert.equal(declaration(rule(panel), "column-gap"), "0");
  const code = rule(panel + ' > code');
  assert.equal(declaration(code, "min-inline-size"), "0");
  assert.equal(declaration(code, "line-height"), "1.6");
  const copy = rule('body:not(.is-mobile) .markdown-rendered pre > button.copy-code-button:not(.clickable-icon):not(.mod-settings *)');
  assert.equal(declaration(copy, "position"), "static");
  assert.equal(declaration(copy, "grid-column"), "2");
  assert.equal(declaration(copy, "grid-row"), "1");
  assert.equal(declaration(copy, "opacity"), "1");
  assert.equal(declaration(copy, "margin-inline-start"), "var(--pixel-space-3)");
});
