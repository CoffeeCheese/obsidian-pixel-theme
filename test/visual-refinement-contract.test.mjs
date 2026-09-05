import assert from "node:assert/strict";
import test from "node:test";
import { atRuleBody, declaration, readTheme, ruleBody } from "../test-support/theme-css.mjs";

function luminance(hex) {
  const rgb = hex.match(/[a-f\d]{2}/gi).map(v => parseInt(v, 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("preferences remove duplicate highlights while keeping a single focused row rail", async () => {
  const css = await readTheme();
  const row = ".mod-settings .vertical-tab-content .setting-item:not(.setting-item-heading)";
  assert.equal(declaration(ruleBody(css, row), "box-shadow"), "none");
  assert.equal(declaration(ruleBody(css, `${row}:focus-within`), "box-shadow"), "inset 3px 0 0 var(--pixel-cyan)");
  const control = ruleBody(css.replace(/\s+/g, " "), '.mod-settings .setting-item-control > :is(button:not(.clickable-icon), input:not([type=checkbox]):not([type=radio]):not([type=color]), textarea, select.dropdown, .combobox-button)');
  assert.equal(declaration(control, "box-shadow"), "none");
  assert.match(declaration(control, "border"), /var\(--pixel-settings-edge\)/);
});

test("settings descriptions and prompt paths use readable supporting typography", async () => {
  const css = await readTheme();
  const name = ruleBody(css, ".mod-settings .setting-item-info > .setting-item-name");
  const description = ruleBody(css, ".mod-settings .setting-item-info > .setting-item-description");
  const path = ruleBody(css, ".prompt .suggestion-item.mod-complex .suggestion-note");
  assert.equal(declaration(name, "line-height"), "1.45");
  assert.equal(declaration(description, "line-height"), "1.65");
  assert.equal(declaration(description, "overflow-wrap"), "anywhere");
  assert.equal(declaration(path, "color"), "var(--pixel-text-muted)");
  assert.equal(declaration(path, "font-weight"), "400");
  assert.equal(declaration(path, "line-height"), "1.5");
  for (const body of [name, description, path]) {
    assert.equal(declaration(body, "font-family"), "var(--pixel-font-text)");
    assert.doesNotMatch(body, /(?:^|[;\n])\s*(?:height|position|transform):/);
  }
});

test("dark floating surfaces separate from paper while preserving text and edge contrast", async () => {
  const css = await readTheme();
  const dark = ruleBody(css, ".theme-dark");
  const surface = declaration(dark, "--pixel-floating-surface");
  const edge = declaration(dark, "--pixel-floating-edge");
  assert.ok(luminance(surface) > luminance(declaration(dark, "--pixel-paper")));
  for (const role of ["--pixel-text", "--pixel-text-muted", "--pixel-cyan", "--pixel-amber-text", "--pixel-brick"]) {
    assert.ok(contrast(declaration(dark, role), surface) >= 4.5, role);
  }
  for (const role of ["--pixel-paper", "--pixel-canvas", "--pixel-surface-secondary"]) {
    assert.ok(contrast(edge, declaration(dark, role)) >= 3, role);
  }
  assert.ok(contrast(edge, surface) >= 3);
  assert.equal(declaration(ruleBody(css, ".theme-light"), "--pixel-floating-surface"), "var(--pixel-paper)");
  const layer = ruleBody(css, "body:not(.is-mobile) :is(.menu, .suggestion-container, .prompt, .notice, .tooltip):where(:not(.mod-warning):not(.mod-error))");
  assert.equal(declaration(layer, "border-color"), "var(--pixel-floating-edge)");
  assert.equal(declaration(layer, "background-color"), "var(--pixel-floating-surface)");
  assert.doesNotMatch(layer, /(?:transform|transition|opacity|box-shadow):/);
  const tooltip = ruleBody(css, "body:not(.is-mobile) .tooltip:where(:not(.mod-warning):not(.mod-error))");
  assert.equal(declaration(tooltip, "--background-modifier-message"), "var(--pixel-floating-surface)");
  const forced = ruleBody(atRuleBody(css, "@media (forced-colors: active)"), ".theme-dark");
  assert.equal(declaration(forced, "--pixel-floating-surface"), "canvas");
  assert.equal(declaration(forced, "--pixel-floating-edge"), "canvastext");
});
