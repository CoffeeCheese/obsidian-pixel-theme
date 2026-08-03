import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  atRuleBody,
  combinedRuleBody,
  declaration,
  matchingRuleBodies,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

test("Graph and Canvas map stable Obsidian roles through the Pixel palette", async () => {
  const css = await readTheme();
  const theme = ruleBody(css, ".theme-light,\n.theme-dark");
  const expectedMappings = {
    "--graph-controls-width": "min(240px, calc(100% - var(--pixel-space-6)))",
    "--graph-text": "var(--pixel-text)",
    "--graph-line": "var(--pixel-border-meaningful)",
    "--graph-node": "var(--pixel-text)",
    "--graph-node-focused": "var(--pixel-cyan)",
    "--graph-node-tag": "var(--pixel-cyan)",
    "--graph-node-attachment": "var(--pixel-amber-text)",
    "--graph-node-unresolved": "var(--pixel-brick)",
    "--canvas-background": "var(--pixel-canvas)",
    "--canvas-dot-pattern": "var(--pixel-line)",
    "--canvas-card-label-color": "var(--pixel-text)",
    "--canvas-color": "var(--pixel-border-meaningful-rgb)",
    "--canvas-color-1": "var(--pixel-brick-rgb)",
    "--canvas-color-2": "var(--pixel-amber-rgb)",
    "--canvas-color-5": "var(--pixel-cyan-rgb)",
    "--canvas-controls-radius": "var(--pixel-radius)",
  };

  for (const [property, value] of Object.entries(expectedMappings)) {
    assert.equal(declaration(theme, property), value);
  }

  const expectedModes = {
    ".theme-light": "96, 113, 132",
    ".theme-dark": "143, 162, 173",
  };
  for (const [selector, rgb] of Object.entries(expectedModes)) {
    assert.equal(
      declaration(ruleBody(css, selector), "--pixel-border-meaningful-rgb"),
      rgb,
    );
  }

  const runtimeDefault = ruleBody(css, "body.theme-light,\nbody.theme-dark");
  assert.equal(
    declaration(runtimeDefault, "--canvas-color"),
    "var(--pixel-border-meaningful-rgb)",
  );
});

test("Graph keeps its renderer semantic colors and native settings controls readable", async () => {
  const css = await readTheme();
  const surface = ruleBodyForSelector(
    css,
    ".workspace-split.mod-root .workspace-leaf-content[data-type=graph] .view-content",
  );
  assert.equal(declaration(surface, "--background-primary"), "var(--pixel-canvas)");
  assert.equal(declaration(surface, "background-color"), "var(--pixel-canvas)");

  const controls = ruleBody(css, ".graph-controls");
  assert.equal(declaration(controls, "border-radius"), "var(--pixel-radius)");
  assert.equal(declaration(controls, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(controls, "color"), "var(--pixel-text)");

  const openControls = ruleBody(css, ".graph-controls:not(.is-close)");
  assert.equal(
    declaration(openControls, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(
    declaration(openControls, "box-shadow"),
    "var(--pixel-shadow-control)",
  );

  const unresolved = ruleBody(css, ".graph-view.color-fill-unresolved");
  assert.equal(declaration(unresolved, "opacity"), "1");

  assert.doesNotMatch(
    css,
    /graph-(?:controls|control-section|view)[^{]*\{[^}]*(?:display:\s*none|pointer-events:\s*none)/is,
  );
});

test("Canvas keeps restrained meaningful node, selection, edge, and media boundaries", async () => {
  const css = await readTheme();
  const wrapper = ruleBody(css, ".canvas-wrapper");
  assert.equal(declaration(wrapper, "background-color"), "var(--canvas-background)");

  const node = combinedRuleBody(css, ".canvas-node-container");
  assert.equal(
    declaration(node, "border"),
    "var(--pixel-border-decoration) solid rgb(var(--canvas-color))",
  );
  assert.equal(declaration(node, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(node, "box-shadow"), "none");

  const selected = ruleBody(
    css,
    ".canvas-node:is(.is-selected, .is-focused, .is-editing) .canvas-node-container,\n.canvas-node.is-themed:is(.is-selected, .is-focused, .is-editing) .canvas-node-container",
  );
  assert.equal(declaration(selected, "border-color"), "var(--pixel-cyan)");
  assert.equal(
    declaration(selected, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(selected, "box-shadow"), "none");

  const group = ruleBody(css, ".canvas-node-group:not(.is-themed)");
  assert.equal(
    declaration(group, "--canvas-color"),
    "var(--pixel-amber-rgb)",
  );

  const embeddedMedia = ruleBody(
    css,
    ".canvas-node-content:is(.markdown-embed, .media-embed)",
  );
  assert.equal(declaration(embeddedMedia, "border"), "0");
  assert.equal(declaration(embeddedMedia, "box-shadow"), "none");

  for (const selector of [
    ".canvas-selection",
    ".canvas-selection.mod-group-selection",
  ]) {
    const selection = ruleBody(css, selector);
    assert.equal(declaration(selection, "border-color"), "var(--pixel-cyan)");
    assert.equal(
      declaration(selection, "background-color"),
      "var(--pixel-selection)",
    );
  }

  const focusedEdge = matchingRuleBodies(
    css,
    ".canvas-edges g.is-focused path.canvas-display-path",
  ).at(-1);
  assert.equal(declaration(focusedEdge, "stroke"), "var(--pixel-cyan)");

  assert.doesNotMatch(
    css,
    /(?:canvas-node-resizer|canvas-node-connection-point|canvas-interaction-path)[^{]*\{[^}]*(?:display:\s*none|pointer-events:\s*none)/is,
  );
});

test("Canvas menus and native icon controls share active, disabled, and focus syntax", async () => {
  const css = await readTheme();
  const controls = ruleBody(
    css,
    ".canvas-control-group,\n.canvas-card-menu,\n.canvas-menu,\n.canvas-submenu",
  );
  assert.equal(
    declaration(controls, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(controls, "background-color"), "var(--pixel-paper)");
  assert.equal(
    declaration(controls, "box-shadow"),
    "var(--pixel-shadow-control)",
  );

  const active = ruleBody(
    css,
    ".canvas-control-item:is(.is-active, .has-active-menu)",
  );
  assert.equal(
    declaration(active, "border-inline-start"),
    "4px solid var(--pixel-cyan)",
  );
  assert.equal(declaration(active, "font-weight"), "600");

  const disabled = ruleBody(css, ".canvas-control-item.is-disabled");
  assert.equal(
    declaration(disabled, "background-color"),
    "var(--pixel-surface-secondary)",
  );
  assert.equal(declaration(disabled, "color"), "var(--pixel-text-muted)");
  assert.equal(declaration(disabled, "cursor"), "not-allowed");

  const focus = ruleBodyForSelector(css, ".canvas-control-item:focus-visible");
  assert.equal(
    declaration(focus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );

  assert.doesNotMatch(
    css,
    /(?:canvas-control-item|canvas-card-menu-button)[^{]*\{[^}]*(?:svg\s*\{|display:\s*none|pointer-events:\s*none)/is,
  );
});

test("spatial surfaces respect reduced motion, forced colors, and stronger contrast", async () => {
  const css = await readTheme();
  const reducedMotion = atRuleBody(css, "@media (prefers-reduced-motion: reduce)");
  for (const selector of [
    ".graph-color-group",
    ".canvas-wrapper.mod-animating .canvas-node-label",
    ".canvas-wrapper.mod-animating .canvas-group-label",
    ".canvas-card-menu-button.mod-draggable svg",
    ".canvas-wrapper .canvas-edges path.canvas-display-path",
  ]) {
    const rule = ruleBodyForSelector(reducedMotion, selector);
    assert.equal(declaration(rule, "transition-duration"), "0ms");
    assert.equal(declaration(rule, "animation"), "none");
  }

  const forcedColors = atRuleBody(css, "@media (forced-colors: active)");
  const systemRoles = ruleBody(forcedColors, ".theme-light,\n  .theme-dark");
  assert.equal(declaration(systemRoles, "--graph-node"), "canvastext");
  assert.equal(declaration(systemRoles, "--graph-node-focused"), "highlight");
  assert.equal(declaration(systemRoles, "--canvas-background"), "canvas");
  assert.equal(declaration(systemRoles, "--canvas-dot-pattern"), "canvastext");

  const forcedNode = ruleBodyForSelector(forcedColors, ".canvas-node-container");
  assert.equal(declaration(forcedNode, "border-color"), "canvastext");
  assert.equal(declaration(forcedNode, "background-color"), "canvas");

  const forcedEdge = ruleBody(
    forcedColors,
    ".canvas-edges g.is-focused path.canvas-display-path",
  );
  assert.equal(declaration(forcedEdge, "stroke"), "highlight");

  const highContrast = atRuleBody(css, "@media (prefers-contrast: more)");
  const contrastNode = ruleBody(
    highContrast,
    "body.theme-light .canvas-node-container,\n  body.theme-dark .canvas-node-container",
  );
  assert.equal(
    declaration(contrastNode, "border-width"),
    "var(--pixel-border-control)",
  );
});

test("spatial styling avoids expensive selectors and decorative rendering effects", async () => {
  const source = await readFile(
    new URL("../src/scss/core-plugins/_spatial.scss", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /:has\s*\(/i);
  assert.doesNotMatch(source, /(?:backdrop-)?filter\s*:/i);
  assert.doesNotMatch(source, /\bblur\s*\(/i);
  assert.doesNotMatch(source, /animation(?:-\w+)?\s*:/i);
  assert.doesNotMatch(source, /perspective\s*:/i);
  assert.doesNotMatch(source, /!important/i);
  assert.doesNotMatch(source, /background-image\s*:/i);

  const selectors = [...source.matchAll(/([^{}]+)\{/g)]
    .map((match) => match[1].trim())
    .filter((selector) => !selector.startsWith("@"));
  for (const selector of selectors) {
    for (const candidate of selector.split(",")) {
      const descendantSteps = candidate.trim().split(/\s+(?![^()]*\))/).length - 1;
      assert.ok(
        descendantSteps <= 2,
        `Expected a shallow spatial selector, received ${candidate.trim()}`,
      );
    }
  }
});
