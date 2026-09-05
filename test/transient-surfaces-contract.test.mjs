import assert from "node:assert/strict";
import test from "node:test";
import { atRuleBody, declaration, readTheme, ruleBodyForSelector } from "../test-support/theme-css.mjs";

test("desktop transient surfaces scale their borders and elevation by purpose", async () => {
  const css = await readTheme();
  for (const selector of [".menu", ".suggestion-container"]) {
    const rule = ruleBodyForSelector(css, `body:not(.is-mobile) ${selector}`);
    assert.equal(declaration(rule, "box-shadow"), "var(--pixel-shadow-buffer)");
    assert.equal(declaration(rule, "border"), "var(--pixel-border-decoration) solid var(--pixel-border-meaningful)");
    assert.equal(declaration(rule, "transition"), "opacity var(--pixel-motion-state) var(--pixel-ease-out)");
    assert.doesNotMatch(rule, /(?:position|transform|inset|opacity):/);
  }
  for (const [selector, shadow] of [[".prompt", "shell"], [".tooltip", "control"], [".notice", "buffer"]]) {
    const rule = ruleBodyForSelector(css, `body:not(.is-mobile) ${selector}`);
    assert.equal(declaration(rule, "box-shadow"), `var(--pixel-shadow-${shadow})`);
    assert.doesNotMatch(rule, /(?:transform|position|animation|opacity):/);
  }
  const selected = ruleBodyForSelector(css, "body:not(.is-mobile) .menu .menu-item.is-selected");
  assert.equal(declaration(selected, "outline-offset"), "-1px");
  for (const selector of [".tooltip", ".notice"]) {
    assert.doesNotMatch(ruleBodyForSelector(css, `body:not(.is-mobile) ${selector}`), /border-width:/);
  }
});

test("entrance feedback respects reduced motion and native positioning", async () => {
  const css = await readTheme();
  const motion = atRuleBody(css, "@media (prefers-reduced-motion: no-preference)");
  const starting = atRuleBody(motion, "@starting-style");
  for (const selector of [".menu", ".suggestion-container", ".prompt", ".modal"]) {
    const rule = ruleBodyForSelector(starting, `body:not(.is-mobile) ${selector}`);
    assert.equal(declaration(rule, "opacity"), "0");
    assert.doesNotMatch(rule, /transform|animation|position|inset/);
  }
});

test("search clear feedback preserves the native icon, visibility and hit target", async () => {
  const css = await readTheme();
  for (const selector of ["body .search-input-container .search-input-clear-button", "body .prompt .search-input-clear-button"]) {
    const base = ruleBodyForSelector(css, selector);
    assert.equal(declaration(base, "color"), "var(--pixel-text-muted)");
    assert.doesNotMatch(base, /(?:display|width|height|inline-size|block-size|position|content|transform):/);
    const hover = ruleBodyForSelector(css, `${selector}:hover`);
    assert.equal(declaration(hover, "background-color"), "var(--pixel-surface-secondary)");
    const focus = ruleBodyForSelector(css, `${selector}:focus-visible`);
    assert.equal(declaration(focus, "outline-offset"), "-2px");
    assert.match(declaration(focus, "outline"), /var\(--pixel-cyan\)/);
  }
});
