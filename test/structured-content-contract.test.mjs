import assert from "node:assert/strict";
import test from "node:test";
import {
  atRuleBody,
  combinedRuleBody,
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

test("structured content maps stable Obsidian callout, code, table, embed, and footnote roles", async () => {
  const css = await readTheme();
  const body = combinedRuleBody(css, "body");
  const theme = ruleBody(css, ".theme-light,\n.theme-dark");

  assert.equal(declaration(body, "--code-size"), "0.9em");

  const expectedMappings = {
    "--callout-border-width": "var(--pixel-border-control)",
    "--callout-border-opacity": "1",
    "--callout-radius": "var(--pixel-radius)",
    "--callout-blend-mode": "normal",
    "--callout-title-color": "var(--pixel-text)",
    "--callout-content-background": "transparent",
    "--code-white-space": "pre",
    "--code-border-width": "var(--pixel-border-decoration)",
    "--code-border-color": "var(--pixel-line)",
    "--code-radius": "var(--pixel-radius)",
    "--code-background": "var(--pixel-surface-secondary)",
    "--code-normal": "var(--pixel-text)",
    "--code-comment": "var(--pixel-text-muted)",
    "--table-background": "var(--pixel-paper)",
    "--table-border-width": "var(--pixel-border-decoration)",
    "--table-border-color": "var(--pixel-border-meaningful)",
    "--table-white-space": "normal",
    "--table-header-background": "var(--pixel-surface-secondary)",
    "--table-header-border-width": "var(--pixel-border-control)",
    "--table-header-border-color": "var(--pixel-border-meaningful)",
    "--table-header-weight": "700",
    "--table-header-color": "var(--pixel-text)",
    "--table-column-min-width": "12ch",
    "--table-row-background-hover": "var(--pixel-surface-secondary)",
    "--table-selection": "var(--pixel-selection)",
    "--table-selection-blend-mode": "normal",
    "--table-selection-border-color": "var(--pixel-cyan)",
    "--table-selection-border-radius": "var(--pixel-radius)",
    "--embed-max-height": "min(60vh, 720px)",
    "--embed-background": "var(--pixel-paper)",
    "--embed-border-start": "4px solid var(--pixel-cyan)",
    "--embed-border-end": "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
    "--embed-border-top": "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
    "--embed-border-bottom": "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
    "--embed-block-shadow-hover": "none",
    "--footnote-divider-color-active": "var(--pixel-cyan)",
    "--footnote-divider-color": "var(--pixel-border-meaningful)",
    "--footnote-divider-width": "var(--pixel-border-decoration)",
    "--footnote-id-color": "var(--pixel-text)",
    "--footnote-input-background": "var(--pixel-paper)",
    "--footnote-input-background-active": "var(--pixel-surface-secondary)",
    "--hr-color": "var(--pixel-border-meaningful)",
    "--hr-thickness": "var(--pixel-border-control)",
  };

  for (const [property, value] of Object.entries(expectedMappings)) {
    assert.equal(declaration(theme, property), value);
  }
});

test("callouts preserve type, title, icon, folding, and nested content with structural warning and error cues", async () => {
  const css = await readTheme();
  const callout = ruleBody(css, ".callout");
  assert.equal(
    declaration(callout, "--pixel-callout-fallback-glyph"),
    '"i"',
  );
  assert.equal(
    declaration(callout, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(
    declaration(callout, "border-inline-start"),
    "4px solid rgb(var(--callout-color))",
  );
  assert.equal(declaration(callout, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(callout, "color"), "var(--pixel-text)");
  assert.equal(declaration(callout, "box-shadow"), "none");
  assert.equal(declaration(callout, "animation"), "none");

  for (const selector of [
    '.callout[data-callout=warning]',
    '.callout[data-callout=caution]',
    '.callout[data-callout=attention]',
  ]) {
    const warning = ruleBodyForSelector(css, selector);
    assert.equal(
      declaration(warning, "border-color"),
      "var(--pixel-amber-text)",
    );
    assert.equal(
      declaration(warning, "--pixel-callout-fallback-glyph"),
      '"!"',
    );
    assert.equal(
      declaration(warning, "border-inline-start-width"),
      "4px",
    );
    assert.equal(declaration(warning, "background-color"), "var(--pixel-paper)");
    assert.equal(declaration(warning, "color"), "var(--pixel-text)");
  }

  for (const selector of [
    '.callout[data-callout=danger]',
    '.callout[data-callout=error]',
    '.callout[data-callout=bug]',
    '.callout[data-callout=failure]',
    '.callout[data-callout=fail]',
    '.callout[data-callout=missing]',
  ]) {
    const error = ruleBodyForSelector(css, selector);
    assert.equal(
      declaration(error, "--pixel-callout-fallback-glyph"),
      '"×"',
    );
    assert.equal(declaration(error, "border-color"), "var(--pixel-brick)");
    assert.equal(declaration(error, "border-inline-start-width"), "4px");
    assert.equal(declaration(error, "background-color"), "var(--pixel-paper)");
    assert.equal(declaration(error, "color"), "var(--pixel-text)");
  }

  const title = ruleBody(css, ".callout-title");
  assert.equal(declaration(title, "color"), "var(--pixel-text)");
  assert.equal(declaration(title, "font-weight"), "700");

  const icon = ruleBody(css, ".callout-icon");
  assert.equal(declaration(icon, "color"), "rgb(var(--callout-color))");

  const iconFallback = ruleBody(
    css,
    ".callout-icon:has(> svg:empty)::before",
  );
  assert.equal(
    declaration(iconFallback, "content"),
    "var(--pixel-callout-fallback-glyph)",
  );
  assert.equal(
    declaration(iconFallback, "border"),
    "var(--pixel-border-control) solid currentcolor",
  );
  assert.equal(declaration(iconFallback, "font-family"), "var(--font-monospace)");

  const foldFocus = ruleBody(css, ".callout.is-collapsible .callout-title:focus-visible");
  assert.equal(
    declaration(foldFocus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(foldFocus, "outline-offset"), "2px");

  assert.doesNotMatch(
    css,
    /(?:callout-title|callout-icon|callout-fold|callout-content)[^{]*\{[^}]*(?:display:\s*none|pointer-events:\s*none)/is,
  );
});

test("inline and fenced code keep mono typography, restrained boundaries, and stable scrolling", async () => {
  const css = await readTheme();
  const inlineCode = combinedRuleBody(css, ".markdown-rendered code");
  assert.equal(declaration(inlineCode, "font-family"), "var(--font-monospace)");
  assert.equal(declaration(inlineCode, "font-size"), "var(--code-size)");
  assert.equal(declaration(inlineCode, "line-height"), "1.65");

  const codeBlock = ruleBody(css, ".markdown-rendered pre");
  assert.equal(declaration(codeBlock, "max-inline-size"), "100%");
  assert.equal(declaration(codeBlock, "overflow-x"), "auto");
  assert.equal(
    declaration(codeBlock, "border"),
    "var(--code-border-width) solid var(--code-border-color)",
  );
  assert.equal(declaration(codeBlock, "box-shadow"), "none");
  assert.equal(declaration(codeBlock, "animation"), "none");

  const sourceCode = ruleBodyForSelector(
    css,
    ":where(.markdown-source-view.mod-cm6) .HyperMD-codeblock",
  );
  assert.equal(declaration(sourceCode, "font-family"), "var(--font-monospace)");
  assert.equal(declaration(sourceCode, "line-height"), "1.65");
});

test("reading and live-preview tables retain hierarchy, alignment, editing controls, and horizontal overflow", async () => {
  const css = await readTheme();
  const readingWrapper = ruleBodyForSelector(
    css,
    ".markdown-rendered .el-table",
  );
  assert.equal(declaration(readingWrapper, "max-inline-size"), "100%");
  assert.equal(declaration(readingWrapper, "overflow-x"), "auto");
  assert.equal(declaration(readingWrapper, "overscroll-behavior-inline"), "contain");

  const liveTable = ruleBodyForSelector(
    css,
    ".markdown-source-view.mod-cm6 .cm-table-widget",
  );
  assert.equal(declaration(liveTable, "max-inline-size"), "100%");
  assert.equal(declaration(liveTable, "overflow-x"), "auto");
  assert.equal(declaration(liveTable, "overscroll-behavior-inline"), "contain");

  const table = combinedRuleBody(css, ".markdown-rendered table");
  assert.equal(declaration(table, "min-inline-size"), "100%");
  assert.equal(declaration(table, "box-shadow"), "none");
  assert.equal(declaration(table, "animation"), "none");

  const cell = ruleBodyForSelector(css, ".markdown-rendered td");
  assert.equal(declaration(cell, "overflow-wrap"), "anywhere");
  assert.equal(declaration(cell, "text-overflow"), "clip");

  assert.doesNotMatch(
    css,
    /(?:table-row-drag-handle|table-col-drag-handle|table-row-btn|table-col-btn)[^{]*\{[^}]*(?:display:\s*none|pointer-events:\s*none)/is,
  );
});

test("internal embeds, attachments, images, and native media controls remain bounded and operable", async () => {
  const css = await readTheme();
  const embed = ruleBodyForSelector(css, ".markdown-embed");
  assert.equal(declaration(embed, "max-inline-size"), "100%");
  assert.equal(
    declaration(embed, "border-inline-start-color"),
    "var(--pixel-cyan)",
  );
  assert.equal(declaration(embed, "box-shadow"), "none");
  assert.equal(declaration(embed, "animation"), "none");

  const embedContent = ruleBody(css, ".inline-embed > .markdown-embed-content");
  assert.equal(declaration(embedContent, "max-block-size"), "var(--embed-max-height)");
  assert.equal(declaration(embedContent, "overflow"), "auto");
  assert.equal(declaration(embedContent, "overscroll-behavior"), "contain");

  const attachment = ruleBodyForSelector(css, ".file-embed");
  assert.equal(
    declaration(attachment, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(attachment, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(attachment, "box-shadow"), "none");

  const missingAttachment = ruleBodyForSelector(css, ".file-embed.mod-empty");
  assert.equal(
    declaration(missingAttachment, "border-style"),
    "dashed",
  );

  const media = ruleBodyForSelector(css, ".image-embed");
  assert.equal(declaration(media, "max-inline-size"), "100%");
  assert.equal(
    declaration(media, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(media, "box-shadow"), "none");

  const mediaFocus = ruleBodyForSelector(css, "audio:focus-visible");
  assert.equal(
    declaration(mediaFocus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(mediaFocus, "outline-offset"), "2px");

  const title = ruleBodyForSelector(css, ".embed-title");
  assert.equal(declaration(title, "white-space"), "normal");
  assert.equal(declaration(title, "overflow-wrap"), "anywhere");

  assert.doesNotMatch(
    css,
    /(?:markdown-embed-link|file-embed-link|edit-block-button)[^{]*\{[^}]*(?:display:\s*none|pointer-events:\s*none)/is,
  );
});

test("footnotes, math, comments, rules, highlights, tags, and nested tasks keep cross-mode semantics", async () => {
  const css = await readTheme();
  const footnotes = ruleBody(css, ".footnotes");
  assert.equal(
    declaration(footnotes, "border-block-start"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(footnotes, "color"), "var(--pixel-text)");

  const footnoteLink = ruleBodyForSelector(css, ".footnote-link");
  assert.equal(declaration(footnoteLink, "color"), "var(--link-color)");
  assert.equal(declaration(footnoteLink, "text-decoration"), "underline");

  const math = ruleBodyForSelector(css, "mjx-container");
  assert.equal(declaration(math, "max-inline-size"), "100%");
  assert.equal(declaration(math, "overflow-x"), "auto");
  assert.equal(declaration(math, "color"), "var(--pixel-text)");

  const comment = ruleBodyForSelector(css, ".cm-comment");
  assert.equal(declaration(comment, "color"), "var(--pixel-text-muted)");
  assert.equal(declaration(comment, "font-style"), "italic");

  const rule = ruleBody(css, ".markdown-rendered hr");
  assert.equal(
    declaration(rule, "border-top"),
    "var(--hr-thickness) solid var(--hr-color)",
  );

  const highlight = ruleBody(css, ".markdown-rendered mark");
  assert.equal(
    declaration(highlight, "background-color"),
    "var(--pixel-context-label)",
  );
  assert.equal(declaration(highlight, "color"), "var(--pixel-text)");

  const tag = ruleBody(css, "a.tag");
  assert.equal(
    declaration(tag, "border"),
    "var(--tag-border-width) solid var(--tag-border-color)",
  );

  const taskFocus = ruleBodyForSelector(css, "input[type=checkbox]:focus-visible");
  assert.equal(
    declaration(taskFocus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  const disabledTask = ruleBodyForSelector(css, "input:disabled");
  assert.equal(declaration(disabledTask, "cursor"), "not-allowed");
});

test("structured content uses no decorative motion or raised content-card shadows", async () => {
  const css = await readTheme();
  const reducedMotion = atRuleBody(css, "@media (prefers-reduced-motion: reduce)");
  const foldIcon = ruleBodyForSelector(reducedMotion, ".callout-fold .svg-icon");
  assert.equal(declaration(foldIcon, "transition-duration"), "0ms");
  assert.equal(declaration(foldIcon, "animation"), "none");

  const cssWithoutEmbeddedFonts = css.replace(
    /@font-face\s*\{[\s\S]*?\}/g,
    "",
  );
  assert.doesNotMatch(cssWithoutEmbeddedFonts, /scanline|crt/i);
  assert.doesNotMatch(
    css,
    /(?:callout|markdown-embed|file-embed|image-embed|video-embed|audio-embed|table-wrapper|el-table|markdown-rendered\s+table)[^{]*\{[^}]*box-shadow:\s*var\(--pixel-shadow/is,
  );
});
