import assert from "node:assert/strict";
import test from "node:test";
import {
  combinedRuleBody,
  declaration,
  readTheme,
  ruleBody,
} from "../test-support/theme-css.mjs";

test("compiled package maps core Markdown through documented Obsidian variables", async () => {
  const css = await readTheme();
  const body = combinedRuleBody(css, "body");
  const theme = ruleBody(css, ".theme-light,\n.theme-dark");

  const expectedDefaults = {
    "--font-text-size": "16px",
    "--line-height-normal": "1.75",
    "--file-line-width": "72ch",
    "--p-spacing": "1em",
    "--heading-spacing": "2em",
    "--inline-title-font": "var(--pixel-font-identity)",
    "--inline-title-size": "2em",
    "--inline-title-line-height": "1.3",
    "--h1-font": "var(--pixel-font-identity)",
    "--h1-size": "2em",
    "--h1-line-height": "1.3",
    "--h2-font": "var(--pixel-font-identity)",
    "--h2-size": "1.5em",
    "--h2-line-height": "1.4",
    "--h3-font": "var(--pixel-font-identity)",
    "--h3-size": "1.25em",
    "--h3-line-height": "1.5",
    "--h4-font": "var(--pixel-font-text)",
    "--h5-font": "var(--pixel-font-text)",
    "--h6-font": "var(--pixel-font-text)",
  };
  for (const [property, value] of Object.entries(expectedDefaults)) {
    assert.equal(declaration(body, property), value);
  }

  const expectedSemanticMappings = {
    "--link-color": "var(--text-accent)",
    "--link-external-color": "var(--text-accent)",
    "--link-unresolved-color": "var(--text-accent)",
    "--link-decoration": "underline",
    "--blockquote-border-thickness": "var(--pixel-border-control)",
    "--blockquote-border-color": "var(--pixel-amber-text)",
    "--blockquote-color": "var(--pixel-amber-text)",
    "--blockquote-background-color": "var(--pixel-context-label)",
    "--text-highlight-bg": "var(--pixel-context-label)",
    "--tag-color": "var(--text-accent)",
    "--tag-background": "var(--pixel-paper)",
    "--tag-border-color": "var(--text-accent)",
    "--tag-border-width": "var(--pixel-border-decoration)",
    "--tag-radius": "var(--pixel-radius)",
    "--list-marker-color": "var(--pixel-text-muted)",
    "--list-marker-color-collapsed": "var(--text-accent)",
    "--list-bullet-radius": "var(--pixel-radius)",
    "--indentation-guide-color": "var(--pixel-line)",
    "--indentation-guide-color-active": "var(--pixel-cyan)",
    "--collapse-icon-color": "var(--pixel-text-muted)",
    "--collapse-icon-color-collapsed": "var(--text-accent)",
    "--checkbox-color": "var(--interactive-accent)",
    "--checkbox-border-color": "var(--pixel-border-meaningful)",
    "--checklist-done-color": "var(--pixel-text-muted)",
    "--text-selection": "var(--pixel-selection)",
    "--caret-color": "var(--pixel-cyan)",
  };
  for (const [property, value] of Object.entries(expectedSemanticMappings)) {
    assert.equal(declaration(theme, property), value);
  }
});

test("Light and Dark provide mode-neutral editing surface roles", async () => {
  const css = await readTheme();
  const light = ruleBody(css, ".theme-light");
  const dark = ruleBody(css, ".theme-dark");

  assert.equal(declaration(light, "--pixel-active-line"), "#edf5f7");
  assert.equal(declaration(light, "--pixel-selection"), "rgba(25, 125, 140, 0.28)");
  assert.equal(declaration(dark, "--pixel-active-line"), "#1d3039");
  assert.equal(declaration(dark, "--pixel-selection"), "rgba(88, 199, 207, 0.35)");
});
