import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  atRuleBody,
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

test("Bases and PDF map first-party roles through the Pixel palette", async () => {
  const css = await readTheme();
  const theme = ruleBody(css, ".theme-light,\n.theme-dark");
  const expectedMappings = {
    "--bases-header-border-width": "0 0 var(--pixel-border-control) 0",
    "--bases-table-border-color": "var(--pixel-border-meaningful)",
    "--bases-table-row-border-width": "var(--pixel-border-decoration)",
    "--bases-table-column-border-width": "var(--pixel-border-decoration)",
    "--bases-table-header-background": "var(--pixel-paper)",
    "--bases-table-header-color": "var(--pixel-text)",
    "--bases-table-cell-background-selected": "var(--pixel-selection)",
    "--bases-table-cell-shadow-active":
      "0 0 0 var(--pixel-border-control) var(--pixel-cyan)",
    "--bases-table-cell-shadow-focus":
      "0 0 0 var(--pixel-border-control) var(--pixel-cyan)",
    "--bases-table-summary-background": "var(--pixel-paper)",
    "--bases-cards-background": "var(--pixel-paper)",
    "--bases-cards-cover-background": "var(--pixel-surface-secondary)",
    "--bases-cards-shadow": "none",
    "--bases-cards-shadow-hover": "none",
    "--bases-embed-border-color": "var(--pixel-border-meaningful)",
    "--pdf-background": "var(--pixel-canvas)",
    "--pdf-page-background": "var(--pixel-paper)",
    "--pdf-sidebar-background": "var(--pixel-paper)",
    "--pdf-shadow":
      "0 0 0 var(--pixel-border-control) var(--pixel-border-meaningful)",
    "--pdf-spread-shadow":
      "0 0 0 var(--pixel-border-control) var(--pixel-border-meaningful)",
    "--pdf-thumbnail-shadow":
      "0 0 0 var(--pixel-border-control) var(--pixel-border-meaningful)",
  };

  for (const [property, value] of Object.entries(expectedMappings)) {
    assert.equal(declaration(theme, property), value);
  }
});

test("Bases keeps dense table, list, card, summary, and empty-result surfaces restrained", async () => {
  const css = await readTheme();
  const contentLinks = ruleBody(css, ".bases-view");
  assert.equal(declaration(contentLinks, "--link-color"), "var(--pixel-text)");
  assert.equal(
    declaration(contentLinks, "--link-color-hover"),
    "var(--pixel-text)",
  );
  assert.equal(
    declaration(contentLinks, "--link-unresolved-color"),
    "var(--pixel-text)",
  );
  const containers = ruleBody(
    css,
    ".bases-table-container,\n.bases-list-container,\n.bases-cards-container",
  );
  assert.equal(declaration(containers, "box-shadow"), "none");

  const listItem = ruleBody(css, ".bases-list-item");
  assert.equal(
    declaration(listItem, "border-block-end"),
    "var(--pixel-border-decoration) solid var(--pixel-border-meaningful)",
  );

  const card = ruleBody(css, ".bases-cards-item");
  assert.equal(
    declaration(card, "border"),
    "var(--bases-cards-border-width) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(card, "box-shadow"), "none");

  const cardHover = ruleBody(css, ".bases-cards-item:hover");
  assert.equal(declaration(cardHover, "border-color"), "var(--pixel-cyan)");
  assert.equal(declaration(cardHover, "box-shadow"), "none");

  const cardFocus = ruleBody(
    css,
    ".bases-cards-item:focus-within,\n.bases-cards-item:focus-visible",
  );
  assert.equal(
    declaration(cardFocus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(cardFocus, "box-shadow"), "none");

  assert.equal(
    declaration(ruleBody(css, ".bases-error"), "color"),
    "var(--pixel-brick)",
  );
});

test("Bases leaves native menus, resizers, editors, scrolling, and keyboard controls intact", async () => {
  const css = await readTheme();

  assert.doesNotMatch(
    css,
    /(?:^|})\s*[^{}]*(?:\.bases-toolbar|\.bases-table-header-resizer|\.bases-metadata-value|\.metadata-input|\.bases-view)[^{]*\{[^}]*(?:display:\s*none|pointer-events:\s*none|overflow:\s*hidden)/is,
  );
  assert.doesNotMatch(
    css,
    /(?:bases-toolbar|bases-table-header-resizer|bases-metadata-value)[^{]*\{[^}]*svg\s*\{/is,
  );
});

test("PDF chrome uses meaningful boundaries without altering document rendering", async () => {
  const css = await readTheme();
  const toolbar = ruleBody(css, ".pdf-toolbar,\n.pdf-findbar");
  assert.equal(
    declaration(toolbar, "border-block-end"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(toolbar, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(toolbar, "box-shadow"), "none");

  const sidebar = ruleBody(css, ".pdf-sidebar-container");
  assert.equal(
    declaration(sidebar, "border-inline-end"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(sidebar, "box-shadow"), "none");

  const selectedThumbnail = ruleBody(
    css,
    ".pdf-thumbnail-view .thumbnail.selected",
  );
  assert.equal(
    declaration(selectedThumbnail, "border"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(selectedThumbnail, "box-shadow"), "none");

  assert.doesNotMatch(
    css,
    /(?:pdfViewer|pdf-container|canvasWrapper|textLayer|annotationLayer)[^{]*\{[^}]*(?:filter\s*:|image-rendering:\s*(?:pixelated|crisp-edges)|pointer-events:\s*none)/is,
  );
});

test("Bases and PDF respect reduced motion, forced colors, and stronger contrast", async () => {
  const css = await readTheme();
  const reducedMotion = atRuleBody(css, "@media (prefers-reduced-motion: reduce)");
  for (const selector of [
    ".bases-toolbar .text-icon-button",
    ".bases-view .bases-cards-item",
    ".bases-table-container",
    ".pdf-toolbar .clickable-icon",
    ".pdfViewer .page",
    ".pdf-thumbnail-view .thumbnail",
  ]) {
    const rule = ruleBodyForSelector(reducedMotion, selector);
    assert.equal(declaration(rule, "transition-duration"), "0ms");
    assert.equal(declaration(rule, "animation"), "none");
  }

  const forcedColors = atRuleBody(css, "@media (forced-colors: active)");
  const systemRoles = ruleBody(forcedColors, ".theme-light,\n  .theme-dark");
  assert.equal(declaration(systemRoles, "--bases-table-border-color"), "canvastext");
  assert.equal(declaration(systemRoles, "--bases-table-cell-background-selected"), "highlight");
  assert.equal(declaration(systemRoles, "--bases-cards-background"), "canvas");
  assert.equal(declaration(systemRoles, "--pdf-background"), "canvas");
  assert.equal(declaration(systemRoles, "--pdf-shadow"), "none");

  const forcedPage = ruleBodyForSelector(forcedColors, ".pdfViewer .page");
  assert.equal(declaration(forcedPage, "border-color"), "canvastext");
  assert.equal(declaration(forcedPage, "background-color"), "canvas");

  const highContrast = atRuleBody(css, "@media (prefers-contrast: more)");
  const contrastRoles = ruleBody(highContrast, ".theme-light,\n  .theme-dark");
  assert.equal(
    declaration(contrastRoles, "--bases-table-row-border-width"),
    "var(--pixel-border-control)",
  );
  assert.equal(
    declaration(contrastRoles, "--bases-cards-border-width"),
    "var(--pixel-border-control)",
  );
});

test("Bases and PDF exceptions stay shallow and avoid decorative rendering costs", async () => {
  const source = await readFile(
    new URL("../src/scss/core-plugins/_data-document.scss", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /:has\s*\(/i);
  assert.doesNotMatch(source, /(?:backdrop-)?filter\s*:/i);
  assert.doesNotMatch(source, /\bblur\s*\(/i);
  assert.doesNotMatch(source, /animation(?:-\w+)?\s*:/i);
  assert.doesNotMatch(source, /perspective\s*:/i);
  assert.doesNotMatch(source, /!important/i);
  assert.doesNotMatch(source, /background-image\s*:/i);
  assert.doesNotMatch(source, /image-rendering\s*:\s*(?:pixelated|crisp-edges)/i);
  assert.doesNotMatch(source, /(?:\.textLayer|\.annotationLayer|canvas)\s*\{/i);

  const selectors = [...source.matchAll(/([^{}]+)\{/g)]
    .map((match) => match[1].trim())
    .filter((selector) => !selector.startsWith("@"));
  for (const selector of selectors) {
    for (const candidate of selector.split(",")) {
      const descendantSteps = candidate.trim().split(/\s+(?![^()]*\))/).length - 1;
      assert.ok(
        descendantSteps <= 2,
        `Expected a shallow data/document selector, received ${candidate.trim()}`,
      );
    }
  }
});

test("Bases adds hierarchy and visible empty values without changing virtual row geometry", async () => {
  const css = await readTheme();
  const roles = ruleBody(css, ".bases-view");
  assert.equal(declaration(roles, "--bases-table-header-background"), "var(--pixel-surface-secondary)");
  assert.equal(declaration(roles, "--bases-table-cell-background-active"), "var(--pixel-paper)");
  assert.doesNotMatch(roles, /(?:row-height|line-height|position|height):/);
  assert.equal(declaration(ruleBody(css, ".bases-table-header-name"), "text-overflow"), "ellipsis");
  assert.equal(declaration(ruleBody(css, ".bases-table-header-icon"), "flex-shrink"), "0");
  assert.equal(declaration(ruleBodyForSelector(css, ".bases-cards-line:empty::before"), "color"), "var(--pixel-text-muted)");
  assert.equal(declaration(ruleBody(css, ".bases-table-summary-cell .summary-content"), "font-variant-numeric"), "tabular-nums");
  assert.equal(declaration(ruleBody(css, ".bases-table-container .bases-td:focus-within"), "outline-offset"), "-2px");
});

test("PDF narrow toolbars keep controls in flow and permit search input shrinking", async () => {
  const css = await readTheme();
  const center = ruleBody(css, ".pdf-toolbar .pdf-toolbar-center");
  assert.equal(declaration(center, "position"), "static");
  assert.equal(declaration(center, "transform"), "none");
  assert.equal(declaration(ruleBodyForSelector(css, '.pdf-container'), "min-inline-size"), "0");
  assert.equal(declaration(ruleBody(css, '.pdf-findbar .pdf-search-wrapper'), "flex-wrap"), "nowrap");
  assert.equal(declaration(ruleBody(css, '.pdf-findbar .search-input-container'), "min-inline-size"), "12rem");
  assert.equal(declaration(ruleBody(css, '.pdf-findbar .input-right-decorator'), "transform"), "translatey(-50%)");
  assert.equal(declaration(ruleBodyForSelector(css, '.pdf-findbar input[type=search]'), "min-inline-size"), "0");
  assert.equal(declaration(ruleBody(css, ".pdf-thumbnail-view a:focus-visible"), "outline-offset"), "2px");
  assert.equal(declaration(ruleBody(css, ".pdf-findbar .mod-not-found"), "--background-modifier-border"), "var(--pixel-brick)");
});

test("PDF case toggle stays centered through pointer and pressed states", async () => {
  const css = await readTheme();
  const toggle = ruleBody(css, 'body .pdf-findbar .input-right-decorator.clickable-icon:not(.mod-settings *):not(:disabled):not([aria-disabled=true])');
  assert.equal(declaration(toggle, "transform"), "translatey(-50%)");
  assert.doesNotMatch(declaration(toggle, "transition"), /transform|translate|all/);
  assert.match(declaration(toggle, "transition"), /background-color.*--pixel-motion-state/);
});
