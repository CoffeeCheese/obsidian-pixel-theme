import assert from "node:assert/strict";
import test from "node:test";
import {
  combinedRuleBody,
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

test("Source, Live Preview, and Reading share the approved document measure", async () => {
  const css = await readTheme();
  const body = combinedRuleBody(css, "body");

  assert.equal(declaration(body, "--font-text-size"), "16px");
  assert.equal(declaration(body, "--line-height-normal"), "1.75");
  assert.equal(declaration(body, "--file-line-width"), "72ch");
  assert.equal(declaration(body, "--p-spacing"), "1em");
  assert.equal(declaration(body, "--heading-spacing"), "2em");

  const documentSurfaces = ruleBodyForSelector(
    css,
    ".markdown-source-view.mod-cm6 .cm-content",
  );
  assert.equal(
    declaration(documentSurfaces, "font-family"),
    "var(--font-text)",
  );
  assert.equal(
    declaration(documentSurfaces, "line-height"),
    "var(--line-height-normal)",
  );
  assert.equal(declaration(documentSurfaces, "color"), "var(--text-normal)");
});

test("titles keep the approved identity hierarchy without clipping editor blocks", async () => {
  const css = await readTheme();
  const body = combinedRuleBody(css, "body");
  const expectedHeadings = {
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

  for (const [property, value] of Object.entries(expectedHeadings)) {
    assert.equal(declaration(body, property), value);
  }

  const titles = ruleBodyForSelector(css, ".inline-title");
  assert.equal(declaration(titles, "overflow"), "visible");

  const editorHeadings = ruleBodyForSelector(
    css,
    ".markdown-source-view.mod-cm6 .HyperMD-header",
  );
  assert.equal(declaration(editorHeadings, "overflow"), "visible");
  assert.doesNotMatch(editorHeadings, /margin-(?:block|top|bottom)\s*:/);
  assert.doesNotMatch(editorHeadings, /(?:block-size|height)\s*:/);
});

test("Markdown semantics use consistent navigation, emphasis, and list signals", async () => {
  const css = await readTheme();
  const mappings = ruleBody(css, ".theme-light,\n.theme-dark");
  const expectedMappings = {
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
    "--tag-background": "var(--pixel-surface-secondary)",
    "--tag-border-color": "var(--text-accent)",
    "--tag-border-width": "var(--pixel-border-decoration)",
    "--tag-radius": "var(--pixel-radius)",
    "--list-marker-color": "var(--pixel-text-muted)",
    "--list-marker-color-collapsed": "var(--text-accent)",
    "--list-bullet-radius": "var(--pixel-radius)",
    "--indentation-guide-color": "var(--pixel-line)",
    "--indentation-guide-color-active": "var(--pixel-cyan)",
    "--checkbox-color": "var(--interactive-accent)",
    "--checkbox-border-color": "var(--pixel-border-meaningful)",
    "--checklist-done-color": "var(--pixel-text-muted)",
    "--text-selection": "var(--pixel-selection)",
    "--caret-color": "var(--pixel-cyan)",
  };

  for (const [property, value] of Object.entries(expectedMappings)) {
    assert.equal(declaration(mappings, property), value);
  }
});

test("editing signals stay visible without changing Live Preview block geometry", async () => {
  const css = await readTheme();
  const activeLine = ruleBody(
    css,
    ".markdown-source-view.mod-cm6 .cm-line.cm-active",
  );
  assert.equal(
    declaration(activeLine, "background-color"),
    "var(--pixel-active-line)",
  );
  assert.equal(
    declaration(activeLine, "box-shadow"),
    "inset 2px 0 0 var(--pixel-cyan)",
  );
  assert.doesNotMatch(activeLine, /margin-(?:block|top|bottom)\s*:/);
  assert.doesNotMatch(activeLine, /transform\s*:/);

  const foldControl = ruleBodyForSelector(
    css,
    ".markdown-source-view.mod-cm6 .cm-fold-indicator .collapse-indicator",
  );
  assert.equal(declaration(foldControl, "opacity"), "0.7");

  const collapsedControl = ruleBodyForSelector(
    css,
    ".markdown-source-view.mod-cm6 .cm-fold-indicator.is-collapsed .collapse-indicator",
  );
  assert.equal(declaration(collapsedControl, "opacity"), "1");

  const flatProse = ruleBody(css, ".markdown-rendered :is(p, ul, ol, table)");
  assert.equal(declaration(flatProse, "box-shadow"), "none");
  assert.equal(declaration(flatProse, "animation"), "none");
});
