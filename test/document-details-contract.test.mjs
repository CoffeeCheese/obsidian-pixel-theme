import assert from "node:assert/strict";
import test from "node:test";
import { atRuleBody, declaration, matchingRuleBodies, readTheme, ruleBodyForSelector } from "../test-support/theme-css.mjs";

const root = "body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root";
const note = `${root} .workspace-leaf-content[data-type=markdown]`;

test("reading separates link underlines from glyphs and keeps selection legible", async () => {
  const css = await readTheme();
  for (const selector of [".markdown-rendered a.internal-link", ".markdown-rendered a.external-link", ".markdown-source-view.mod-cm6 .cm-hmd-internal-link", ".markdown-source-view.mod-cm6 .cm-link", ".markdown-source-view.mod-cm6 .cm-url"]) {
    const rule = ruleBodyForSelector(css, selector);
    assert.equal(declaration(rule, "text-underline-offset"), "0.18em");
    assert.equal(declaration(rule, "text-decoration-thickness"), "1px");
    assert.doesNotMatch(rule, /text-decoration-style:|animation:|transform:/);
  }
  const selected = ruleBodyForSelector(css, ".markdown-rendered ::selection");
  assert.equal(declaration(selected, "color"), "var(--pixel-text)");
  const system = atRuleBody(css, "@media (forced-colors: active)");
  assert.equal(declaration(ruleBodyForSelector(system, ".markdown-rendered ::selection"), "color"), "highlighttext");
  assert.match(declaration(matchingRuleBodies(css, `${note} .view-content`)[0], "background-image"), /var\(--pixel-reading-grid-ink\)/);
  for (const link of ["internal-link", "external-link"]) {
    assert.equal(declaration(ruleBodyForSelector(css, `.markdown-rendered a.${link}:hover`), "text-decoration-thickness"), "2px");
    assert.match(declaration(ruleBodyForSelector(css, `.markdown-rendered a.${link}:focus-visible`), "outline"), /var\(--pixel-cyan\)/);
  }
});

test("horizontal titles leave room for native close actions and stacked tabs retain native geometry", async () => {
  const css = await readTheme();
  const title = ruleBodyForSelector(css, `${root} .workspace-tab-header-container-inner > .workspace-tab-header .workspace-tab-header-inner-title`);
  assert.equal(declaration(title, "min-inline-size"), "0");
  assert.equal(declaration(title, "text-overflow"), "ellipsis");
  const close = `${root} .workspace-tab-header-inner-close-button`;
  assert.equal(declaration(ruleBodyForSelector(css, close), "flex-shrink"), "0");
  assert.doesNotMatch(ruleBodyForSelector(css, close), /(?:display|visibility|position|inline-size|transform):/);
  assert.match(declaration(ruleBodyForSelector(css, close), "transition"), /var\(--pixel-motion-state\)/);
  assert.equal(declaration(ruleBodyForSelector(css, `${close}:hover`), "background-color"), "var(--pixel-surface-secondary)");
  assert.equal(declaration(ruleBodyForSelector(css, `${close}:focus-visible`), "outline-offset"), "-2px");
  const stacked = `${root} .workspace-tabs.mod-stacked .workspace-tab-container > .workspace-tab-header`;
  assert.equal(declaration(ruleBodyForSelector(css, stacked), "border-radius"), "0");
  assert.doesNotMatch(ruleBodyForSelector(css, stacked), /(?:width|height|inline-size|block-size|position|writing-mode|transform|overflow):/);
  assert.match(declaration(ruleBodyForSelector(css, `${stacked}.is-active`), "box-shadow"), /inset 3px 0 0/);
  assert.match(matchingRuleBodies(css, `${stacked}.is-active`).at(-1), /outline:.*Highlight/);
});

test("document properties allow narrow columns, visible empty values and reachable multiline content", async () => {
  const css = await readTheme();
  assert.equal(declaration(ruleBodyForSelector(css, `${note} .metadata-property-key`), "flex"), "0 0 min(165px, 38%)");
  assert.equal(declaration(ruleBodyForSelector(css, `${note} .metadata-property`), "align-items"), "flex-start");
  assert.equal(declaration(ruleBodyForSelector(css, `${note} .metadata-property-key`), "align-self"), "flex-start");
  assert.match(matchingRuleBodies(css, `${note} .metadata-property-value`).at(-1), /--input-placeholder-color: var\(--pixel-text-muted\)/);
  assert.match(matchingRuleBodies(css, `${note} .metadata-property-value:focus-within`).at(-1), /outline-offset: -1px/);
  assert.match(matchingRuleBodies(css, `${note} .metadata-input-longtext`).at(-1), /overflow-y: auto/);
  const tag = ruleBodyForSelector(css, `${note} .metadata-property-value[data-property-type=tags] .multi-select-pill-content`);
  assert.equal(declaration(tag, "white-space"), "normal");
  assert.equal(declaration(tag, "overflow-wrap"), "anywhere");
  assert.equal(declaration(ruleBodyForSelector(css, `${note} .multi-select-pill`), "margin"), "0");
  assert.equal(declaration(ruleBodyForSelector(css, `${note} .multi-select-pill-remove-button`), "flex-shrink"), "0");
});

test("button press keeps glyph scale stable and uses the reduced-motion aware press duration", async () => {
  const css = await readTheme();
  const press = ruleBodyForSelector(css, 'button:not(.clickable-icon):not(.mod-settings *):not(:disabled):not([aria-disabled=true]):active');
  assert.equal(declaration(press, "transform"), "translatey(1px)");
  assert.equal(declaration(press, "transition-duration"), "var(--pixel-motion-press)");
  const mobile = ruleBodyForSelector(css, 'body.is-mobile button:not(.clickable-icon):not(.mod-settings *):not(:disabled):not([aria-disabled=true]):active');
  assert.equal(declaration(mobile, "transform"), "translatey(1px)");
  const tokens = ruleBodyForSelector(css, "body");
  for (const state of ["", "-hover", "-active"]) {
    const shadow = declaration(tokens, `--pixel-shadow-button${state}`);
    assert.doesNotMatch(shadow, /\d+px \d+px (?:10|14)px/);
  }
});

test("desktop primary buttons avoid inner shadow contours without changing other controls", async () => {
  const css = await readTheme();
  const normalColors = atRuleBody(css, "@media (forced-colors: none)");
  const selector = 'body:not(.is-mobile) button.mod-cta:not(.clickable-icon):not(.mod-settings *):where(:not(.mod-destructive):not(.mod-warning):not(.mod-loading))';
  const rule = ruleBodyForSelector(normalColors, selector);
  for (const [state, depth] of [["", 2], ["-hover", 3], ["-active", 1]]) {
    const shadow = declaration(rule, `--pixel-shadow-button${state}`);
    assert.ok(shadow.startsWith(`0 ${depth}px 0 color-mix(`));
    assert.doesNotMatch(shadow, /inset/);
  }
  assert.doesNotMatch(rule, /(?:transform|outline|border|transition):/);
});
