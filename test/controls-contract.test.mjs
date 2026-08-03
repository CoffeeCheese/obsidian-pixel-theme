import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

async function readTheme() {
  return readFile(path.join(repositoryRoot, "theme.css"), "utf8");
}

function ruleBody(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `Expected compiled theme.css to contain ${selector}`);
  return match[1];
}

function declaration(body, property) {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(
    new RegExp(`(?:^|[;\\n])\\s*${escapedProperty}:\\s*([^;]+);`),
  );
  assert.ok(match, `Expected ${property} in compiled rule`);
  return match[1].trim().toLowerCase();
}

function matchingRuleBody(css, selectorPattern) {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const rule = rules.find((match) => selectorPattern.test(match[1].trim()));
  assert.ok(rule, `Expected compiled rule matching ${selectorPattern}`);
  return rule[2];
}

function atRuleBody(css, prelude) {
  const start = css.indexOf(prelude);
  assert.notEqual(start, -1, `Expected compiled theme.css to contain ${prelude}`);
  const openingBrace = css.indexOf("{", start);
  let depth = 1;

  for (let index = openingBrace + 1; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return css.slice(openingBrace + 1, index);
  }

  assert.fail(`Expected ${prelude} to have a closing brace`);
}

test("compiled controls share Pixel surfaces, meaningful boundaries, and motion", async () => {
  const css = await readTheme();
  const body = ruleBody(css, "body");
  const themeMapping = ruleBody(css, ".theme-light,\n.theme-dark");

  const expectedTokens = {
    "--pixel-motion-press": "80ms",
    "--pixel-motion-state": "120ms",
    "--pixel-motion-surface": "160ms",
    "--pixel-control-min": "32px",
    "--pixel-state-min-block-size": "48px",
  };
  for (const [property, value] of Object.entries(expectedTokens)) {
    assert.equal(declaration(body, property), value);
  }

  const expectedMappings = {
    "--input-border-width": "var(--pixel-border-control)",
    "--input-border-width-focus": "var(--pixel-border-control)",
    "--input-shadow": "var(--pixel-shadow-control)",
    "--input-shadow-hover": "var(--pixel-shadow-control)",
    "--modal-background": "var(--pixel-paper)",
    "--modal-border-color": "var(--pixel-border-meaningful)",
    "--modal-border-width": "var(--pixel-border-control)",
    "--menu-background": "var(--pixel-paper)",
    "--menu-border-color": "var(--pixel-border-meaningful)",
    "--menu-border-width": "var(--pixel-border-control)",
    "--prompt-background": "var(--pixel-paper)",
    "--prompt-border-color": "var(--pixel-border-meaningful)",
    "--prompt-border-width": "var(--pixel-border-control)",
    "--suggestion-background": "var(--pixel-paper)",
    "--setting-items-background": "var(--pixel-paper)",
    "--setting-items-border-color": "var(--pixel-border-meaningful)",
    "--setting-items-border-width": "var(--pixel-border-control)",
  };
  for (const [property, value] of Object.entries(expectedMappings)) {
    assert.equal(declaration(themeMapping, property), value);
  }
});

test("controls expose pointer, keyboard, and pressed feedback without layout shifts", async () => {
  const css = await readTheme();
  const raisedControl = matchingRuleBody(
    css,
    /button:not\(\.clickable-icon\).*\.clickable-icon/s,
  );
  assert.equal(
    declaration(raisedControl, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(raisedControl, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(raisedControl, "color"), "var(--pixel-text)");
  assert.equal(declaration(raisedControl, "box-shadow"), "var(--pixel-shadow-control)");
  assert.equal(declaration(raisedControl, "min-block-size"), "var(--pixel-control-min)");

  const textField = matchingRuleBody(css, /textarea.*input\[type=text\]/s);
  assert.equal(
    declaration(textField, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(textField, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(textField, "color"), "var(--pixel-text)");

  const pressed = matchingRuleBody(css, /button.*:active.*\.clickable-icon.*:active/s);
  assert.equal(declaration(pressed, "transform"), "translate(2px, 2px)");
  assert.equal(declaration(pressed, "box-shadow"), "none");

  const focus = matchingRuleBody(css, /button:focus-visible.*input\[type=text\]:focus-visible/s);
  assert.equal(
    declaration(focus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(focus, "outline-offset"), "2px");

  const pointerHover = atRuleBody(css, "@media (hover: hover) and (pointer: fine)");
  const hover = matchingRuleBody(
    pointerHover,
    /button:not\(\.clickable-icon\):hover.*\.clickable-icon:hover/s,
  );
  assert.equal(
    declaration(hover, "background-color"),
    "var(--pixel-surface-secondary)",
  );
});

test("disabled, selected, warning, danger, loading, and empty states use multiple cues", async () => {
  const css = await readTheme();

  const disabled = matchingRuleBody(
    css,
    /button:disabled.*\.clickable-icon\[aria-disabled=.*input:disabled.*\.suggestion-item\.is-disabled/s,
  );
  assert.equal(declaration(disabled, "opacity"), "1");
  assert.equal(
    declaration(disabled, "background-color"),
    "var(--pixel-surface-secondary)",
  );
  assert.equal(declaration(disabled, "color"), "var(--pixel-text-muted)");
  assert.equal(declaration(disabled, "box-shadow"), "none");
  assert.equal(declaration(disabled, "cursor"), "not-allowed");

  const selected = matchingRuleBody(
    css,
    /\.suggestion-item\.is-selected.*\.menu-item\.is-selected.*\.menu-item\.is-checked/s,
  );
  assert.equal(
    declaration(selected, "box-shadow"),
    "inset 4px 0 0 var(--pixel-cyan)",
  );
  assert.equal(
    declaration(selected, "background-color"),
    "var(--pixel-surface-secondary)",
  );
  assert.equal(declaration(selected, "color"), "var(--pixel-text)");
  assert.equal(declaration(selected, "font-weight"), "600");

  const warning = matchingRuleBody(
    css,
    /\.notice\.mod-warning.*\.tooltip\.mod-warning/s,
  );
  assert.equal(
    declaration(warning, "border"),
    "var(--pixel-border-control) solid var(--pixel-amber-text)",
  );
  assert.equal(declaration(warning, "border-inline-start-width"), "4px");
  assert.equal(declaration(warning, "color"), "var(--pixel-amber-text)");

  const danger = matchingRuleBody(
    css,
    /button\.mod-warning.*button\.mod-destructive.*\[aria-invalid=true\]/s,
  );
  assert.equal(
    declaration(danger, "border"),
    "var(--pixel-border-control) solid var(--pixel-brick)",
  );
  assert.equal(declaration(danger, "border-inline-start-width"), "4px");
  assert.equal(declaration(danger, "color"), "var(--pixel-brick)");

  const loading = ruleBody(css, ".is-loading");
  assert.equal(
    declaration(loading, "min-block-size"),
    "var(--pixel-state-min-block-size)",
  );
  assert.equal(declaration(loading, "cursor"), "progress");
  const loadingIndicator = ruleBody(css, ".is-loading::before");
  assert.equal(declaration(loadingIndicator, "animation"), "none");

  const loadingButton = ruleBody(css, "button.mod-loading");
  assert.equal(declaration(loadingButton, "color"), "var(--pixel-text)");
  const loadingButtonIndicator = ruleBody(css, "button.mod-loading::after");
  assert.equal(declaration(loadingButtonIndicator, "display"), "none");

  const empty = matchingRuleBody(
    css,
    /\.suggestion-empty.*\.empty-state-container.*\.search-empty-state/s,
  );
  assert.equal(
    declaration(empty, "min-block-size"),
    "var(--pixel-state-min-block-size)",
  );
  assert.equal(declaration(empty, "color"), "var(--pixel-text-muted)");
});

test("shared surfaces and native control shapes remain readable and icon-safe", async () => {
  const css = await readTheme();
  const body = ruleBody(css, "body");
  assert.equal(declaration(body, "--pixel-icon-size"), "18px");

  const surfaces = matchingRuleBody(
    css,
    /\.menu.*\.suggestion-container.*\.prompt.*\.modal.*\.notice.*\.tooltip/s,
  );
  assert.equal(
    declaration(surfaces, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(surfaces, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(surfaces, "color"), "var(--pixel-text)");
  assert.equal(declaration(surfaces, "box-shadow"), "var(--pixel-shadow-shell)");

  const settingRow = ruleBody(css, ".setting-item");
  assert.equal(
    declaration(settingRow, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(settingRow, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(settingRow, "box-shadow"), "none");

  const checkbox = matchingRuleBody(
    css,
    /^input\[type=checkbox\],\s*input\[type=radio\]$/s,
  );
  assert.equal(
    declaration(checkbox, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(checkbox, "background-color"), "var(--pixel-paper)");

  const toggle = ruleBody(css, ".checkbox-container");
  assert.equal(
    declaration(toggle, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(toggle, "border-radius"), "var(--pixel-radius)");

  const sliderThumb = ruleBody(css, "input[type=range]::-webkit-slider-thumb");
  assert.equal(
    declaration(sliderThumb, "border"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(sliderThumb, "box-shadow"), "var(--pixel-shadow-control)");

  const icon = ruleBody(css, ".svg-icon");
  assert.equal(declaration(icon, "color"), "currentcolor");
  assert.equal(declaration(icon, "filter"), "none");
  const controlIcon = matchingRuleBody(
    css,
    /\.clickable-icon \.svg-icon.*button \.svg-icon/s,
  );
  assert.equal(declaration(controlIcon, "inline-size"), "var(--pixel-icon-size)");
  assert.equal(declaration(controlIcon, "block-size"), "var(--pixel-icon-size)");

  const mobile = ruleBody(css, "body.is-mobile");
  assert.equal(declaration(mobile, "--pixel-control-min"), "44px");
  assert.equal(declaration(mobile, "--pixel-icon-size"), "24px");
  assert.equal(declaration(mobile, "--input-height"), "44px");
});

test("accessibility preferences remove motion and preserve system-authoritative states", async () => {
  const css = await readTheme();

  const reducedMotion = atRuleBody(css, "@media (prefers-reduced-motion: reduce)");
  const motionlessControls = matchingRuleBody(
    reducedMotion,
    /button.*\.clickable-icon.*input.*\.menu.*\.tooltip/s,
  );
  assert.equal(declaration(motionlessControls, "transition-duration"), "0ms");
  assert.equal(declaration(motionlessControls, "animation"), "none");
  const motionlessDrawers = matchingRuleBody(
    reducedMotion,
    /\.workspace-drawer.*\.modal-bg/s,
  );
  assert.equal(declaration(motionlessDrawers, "transition-duration"), "0ms");
  assert.equal(declaration(motionlessDrawers, "animation"), "none");

  const forcedColors = atRuleBody(css, "@media (forced-colors: active)");
  const systemRoles = matchingRuleBody(
    forcedColors,
    /^\.theme-light,\s*\.theme-dark$/s,
  );
  assert.equal(declaration(systemRoles, "--pixel-canvas"), "canvas");
  assert.equal(declaration(systemRoles, "--pixel-paper"), "canvas");
  assert.equal(declaration(systemRoles, "--pixel-text"), "canvastext");
  assert.equal(declaration(systemRoles, "--pixel-text-muted"), "graytext");
  assert.equal(declaration(systemRoles, "--pixel-cyan"), "highlight");
  assert.equal(declaration(systemRoles, "--pixel-shadow-control"), "none");
  assert.equal(declaration(systemRoles, "--pixel-shadow-shell"), "none");

  const highContrast = atRuleBody(css, "@media (prefers-contrast: more)");
  const strongerRoles = matchingRuleBody(
    highContrast,
    /^\.theme-light,\s*\.theme-dark$/s,
  );
  assert.equal(
    declaration(strongerRoles, "--pixel-border-meaningful"),
    "var(--pixel-text)",
  );
  assert.equal(declaration(strongerRoles, "--pixel-line"), "var(--pixel-text-muted)");

  assert.doesNotMatch(css, /!important/);
  assert.doesNotMatch(css, /@keyframes/);
});
