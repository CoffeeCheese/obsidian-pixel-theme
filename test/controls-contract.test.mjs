import assert from "node:assert/strict";
import test from "node:test";
import {
  atRuleBody,
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

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
  const raisedControl = ruleBodyForSelector(css, "button:not(.clickable-icon)");
  assert.equal(
    declaration(raisedControl, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(raisedControl, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(raisedControl, "color"), "var(--pixel-text)");
  assert.equal(declaration(raisedControl, "box-shadow"), "var(--pixel-shadow-control)");
  assert.equal(declaration(raisedControl, "min-block-size"), "var(--pixel-control-min)");
  assert.match(
    declaration(raisedControl, "transition"),
    /transform var\(--pixel-motion-press\) ease-out/,
  );

  const textField = ruleBodyForSelector(css, "input[type=text]");
  assert.equal(
    declaration(textField, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(textField, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(textField, "color"), "var(--pixel-text)");

  const pressed = ruleBodyForSelector(
    css,
    '.clickable-icon:not([aria-disabled=true]):active',
  );
  assert.equal(declaration(pressed, "transform"), "translate(2px, 2px)");
  assert.equal(declaration(pressed, "box-shadow"), "none");

  const focus = ruleBodyForSelector(css, "button:focus-visible");
  assert.equal(
    declaration(focus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(focus, "outline-offset"), "2px");
  const fieldFocus = ruleBodyForSelector(css, "input[type=text]:focus-visible");
  assert.equal(
    declaration(fieldFocus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  const sliderFocus = ruleBodyForSelector(css, "input[type=range]:focus-visible");
  assert.equal(
    declaration(sliderFocus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(sliderFocus, "outline-offset"), "2px");

  const pointerHover = atRuleBody(css, "@media (hover: hover) and (pointer: fine)");
  const hover = ruleBodyForSelector(pointerHover, ".clickable-icon:hover");
  assert.equal(
    declaration(hover, "background-color"),
    "var(--pixel-surface-secondary)",
  );
});

test("disabled, selected, warning, danger, loading, and empty states use multiple cues", async () => {
  const css = await readTheme();

  const disabled = ruleBodyForSelector(css, ".suggestion-item.is-disabled");
  assert.equal(declaration(disabled, "opacity"), "1");
  assert.equal(
    declaration(disabled, "background-color"),
    "var(--pixel-surface-secondary)",
  );
  assert.equal(declaration(disabled, "color"), "var(--pixel-text-muted)");
  assert.equal(declaration(disabled, "box-shadow"), "none");
  assert.equal(declaration(disabled, "cursor"), "not-allowed");

  const selected = ruleBodyForSelector(css, ".suggestion-item.is-selected");
  assert.equal(
    declaration(selected, "box-shadow"),
    "inset 3px 0 0 var(--pixel-cyan)",
  );
  assert.equal(
    declaration(selected, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 10%, var(--pixel-paper))",
  );
  assert.equal(declaration(selected, "color"), "var(--pixel-text)");
  assert.equal(declaration(selected, "font-weight"), "600");

  const warning = ruleBodyForSelector(css, ".notice.mod-warning");
  assert.equal(
    declaration(warning, "border"),
    "var(--pixel-border-control) solid var(--pixel-amber-text)",
  );
  assert.equal(declaration(warning, "border-inline-start-width"), "4px");
  assert.equal(declaration(warning, "color"), "var(--pixel-amber-text)");

  const danger = ruleBodyForSelector(css, "button.mod-destructive");
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
  assert.equal(declaration(loading, "color"), "var(--pixel-text)");
  assert.equal(declaration(loading, "cursor"), "progress");
  const loadingIndicator = ruleBody(css, ".is-loading::before");
  assert.equal(declaration(loadingIndicator, "animation"), "none");

  const loadingButton = ruleBody(css, "button.mod-loading");
  assert.equal(declaration(loadingButton, "color"), "var(--pixel-text)");
  const loadingButtonIndicator = ruleBody(css, "button.mod-loading::after");
  assert.equal(declaration(loadingButtonIndicator, "display"), "none");

  const empty = ruleBodyForSelector(css, ".suggestion-empty");
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

  const surfaces = ruleBodyForSelector(css, ".menu");
  assert.equal(
    declaration(surfaces, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(surfaces, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(surfaces, "color"), "var(--pixel-text)");
  assert.equal(declaration(surfaces, "box-shadow"), "var(--pixel-shadow-shell)");
  const overlays = ruleBodyForSelector(css, ".modal-bg");
  assert.equal(
    declaration(overlays, "transition"),
    "opacity var(--pixel-motion-surface) linear",
  );

  const settingRow = ruleBody(css, ".setting-item");
  assert.equal(
    declaration(settingRow, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(settingRow, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(settingRow, "box-shadow"), "none");

  const checkbox = ruleBodyForSelector(css, "input[type=checkbox]");
  assert.equal(
    declaration(checkbox, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(checkbox, "background-color"), "var(--pixel-paper)");

  const toggle = ruleBody(css, ".checkbox-container");
  assert.equal(
    declaration(toggle, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(toggle, "border-radius"), "var(--pixel-radius)");
  assert.equal(
    declaration(toggle, "background-color"),
    "color-mix(in srgb, var(--pixel-border-meaningful) 16%, var(--pixel-paper))",
  );
  assert.equal(declaration(toggle, "box-shadow"), "none");

  const modalToggle = ruleBody(css, ".modal label.checkbox-container");
  assert.equal(
    declaration(modalToggle, "width"),
    "var(--pixel-toggle-inline-size)",
  );
  assert.equal(
    declaration(modalToggle, "height"),
    "var(--pixel-toggle-block-size)",
  );
  assert.equal(
    declaration(modalToggle, "--pixel-toggle-inline-size"),
    "44px",
  );
  assert.equal(
    declaration(modalToggle, "--pixel-toggle-block-size"),
    "22px",
  );

  const modalToggleThumb = ruleBody(
    css,
    ".modal label.checkbox-container::after",
  );
  assert.equal(
    declaration(modalToggleThumb, "width"),
    "var(--pixel-toggle-thumb-size)",
  );
  assert.equal(
    declaration(modalToggleThumb, "height"),
    "var(--pixel-toggle-thumb-size)",
  );
  assert.equal(declaration(modalToggleThumb, "margin"), "0");
  assert.equal(declaration(modalToggleThumb, "transform"), "none");

  const enabledToggle = ruleBody(css, ".checkbox-container.is-enabled");
  assert.equal(
    declaration(enabledToggle, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 24%, var(--pixel-paper))",
  );
  const enabledToggleThumb = ruleBody(
    css,
    ".checkbox-container.is-enabled::after",
  );
  assert.equal(
    declaration(enabledToggleThumb, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 68%, var(--pixel-paper))",
  );

  const pressedToggle = ruleBodyForSelector(
    css,
    ".modal label.checkbox-container:not(.is-disabled):active::after",
  );
  assert.equal(declaration(pressedToggle, "transform"), "none");
  assert.equal(declaration(pressedToggle, "box-shadow"), "none");
  assert.equal(declaration(pressedToggle, "opacity"), "0.72");
  const disabledToggleThumb = ruleBodyForSelector(
    css,
    ".checkbox-container.is-disabled::after",
  );
  assert.equal(declaration(disabledToggleThumb, "box-shadow"), "none");

  const sliderThumb = ruleBody(css, "input[type=range]::-webkit-slider-thumb");
  assert.equal(
    declaration(sliderThumb, "border"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(sliderThumb, "box-shadow"), "var(--pixel-shadow-control)");
  const disabledSliderThumb = ruleBodyForSelector(
    css,
    "input[type=range]:disabled::-webkit-slider-thumb",
  );
  assert.equal(declaration(disabledSliderThumb, "box-shadow"), "none");

  const icon = ruleBody(css, ".svg-icon");
  assert.equal(declaration(icon, "color"), "currentcolor");
  assert.equal(declaration(icon, "filter"), "none");
  const controlIcon = ruleBodyForSelector(css, ".clickable-icon .svg-icon");
  assert.equal(declaration(controlIcon, "inline-size"), "var(--pixel-icon-size)");
  assert.equal(declaration(controlIcon, "block-size"), "var(--pixel-icon-size)");

  const mobile = ruleBody(css, "body.is-mobile");
  assert.equal(declaration(mobile, "--pixel-control-min"), "44px");
  assert.equal(declaration(mobile, "--pixel-icon-size"), "24px");
  assert.equal(declaration(mobile, "--input-height"), "44px");

  const coarsePointer = atRuleBody(css, "@media (any-pointer: coarse)");
  const coarseBody = ruleBody(coarsePointer, "body");
  assert.equal(declaration(coarseBody, "--pixel-control-min"), "44px");
  assert.equal(declaration(coarseBody, "--input-height"), "44px");
});

test("accessibility preferences remove motion and preserve system-authoritative states", async () => {
  const css = await readTheme();

  const reducedMotion = atRuleBody(css, "@media (prefers-reduced-motion: reduce)");
  const motionlessControls = ruleBodyForSelector(reducedMotion, ".clickable-icon");
  assert.equal(declaration(motionlessControls, "transition-duration"), "0ms");
  assert.equal(declaration(motionlessControls, "animation"), "none");
  const motionlessDrawers = ruleBodyForSelector(reducedMotion, ".workspace-drawer");
  assert.equal(declaration(motionlessDrawers, "transition-duration"), "0ms");
  assert.equal(declaration(motionlessDrawers, "animation"), "none");

  const forcedColors = atRuleBody(css, "@media (forced-colors: active)");
  const systemRoles = ruleBodyForSelector(forcedColors, ".theme-light");
  assert.equal(declaration(systemRoles, "--pixel-canvas"), "canvas");
  assert.equal(declaration(systemRoles, "--pixel-paper"), "canvas");
  assert.equal(declaration(systemRoles, "--pixel-text"), "canvastext");
  assert.equal(declaration(systemRoles, "--pixel-text-muted"), "graytext");
  assert.equal(declaration(systemRoles, "--pixel-cyan"), "highlight");
  assert.equal(declaration(systemRoles, "--pixel-shadow-control"), "none");
  assert.equal(declaration(systemRoles, "--pixel-shadow-shell"), "none");

  const highContrast = atRuleBody(css, "@media (prefers-contrast: more)");
  const strongerRoles = ruleBodyForSelector(highContrast, ".theme-light");
  assert.equal(
    declaration(strongerRoles, "--pixel-border-meaningful"),
    "var(--pixel-text)",
  );
  assert.equal(declaration(strongerRoles, "--pixel-line"), "var(--pixel-text-muted)");

  assert.doesNotMatch(css, /!important/);
  assert.doesNotMatch(css, /@keyframes/);
});
