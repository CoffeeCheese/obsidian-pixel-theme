import assert from "node:assert/strict";
import test from "node:test";
import {
  declaration,
  readTheme,
  ruleBody,
} from "../test-support/theme-css.mjs";

test("compiled package maps core navigation through documented Obsidian variables", async () => {
  const css = await readTheme();
  const theme = ruleBody(css, ".theme-light,\n.theme-dark");
  const expectedMappings = {
    "--pixel-tree-signal": "var(--pixel-cyan)",
    "--pixel-tree-active-surface": "var(--pixel-nav-label)",
    "--nav-item-color": "var(--pixel-text-muted)",
    "--nav-item-color-hover": "var(--pixel-text)",
    "--nav-item-color-active": "var(--pixel-text)",
    "--nav-item-color-selected": "var(--pixel-text)",
    "--nav-item-color-highlighted": "var(--pixel-tree-signal)",
    "--nav-item-background-hover": "var(--pixel-surface-secondary)",
    "--nav-item-background-active": "var(--pixel-tree-active-surface)",
    "--nav-item-background-selected": "var(--pixel-tree-active-surface)",
    "--nav-item-weight-active": "600",
    "--nav-item-white-space": "normal",
    "--nav-item-children-padding-start": "var(--pixel-space-1)",
    "--nav-item-children-margin-start": "var(--pixel-space-3)",
    "--nav-indentation-guide-width": "var(--pixel-border-decoration)",
    "--nav-indentation-guide-color": "var(--pixel-line)",
    "--nav-collapse-icon-color": "var(--pixel-text-muted)",
    "--nav-collapse-icon-color-collapsed": "var(--pixel-tree-signal)",
    "--nav-heading-color": "var(--pixel-text)",
    "--nav-heading-color-collapsed": "var(--pixel-text-muted)",
    "--nav-heading-weight": "600",
    "--nav-tag-background": "var(--pixel-surface-secondary)",
    "--nav-tag-color": "var(--pixel-text-muted)",
    "--nav-tag-color-active": "var(--pixel-text)",
    "--search-result-background": "var(--pixel-paper)",
  };

  for (const [property, value] of Object.entries(expectedMappings)) {
    assert.equal(declaration(theme, property), value);
  }
});
