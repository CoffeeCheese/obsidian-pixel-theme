import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  atRuleBody,
  combinedRuleBody,
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((part) => Number.parseInt(part, 16) / 255);
  return channels
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    )
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

async function sourceStyles() {
  const root = new URL("../src/scss/", import.meta.url);
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".scss"));
  return Promise.all(
    files.map((entry) => readFile(path.join(entry.parentPath, entry.name), "utf8")),
  );
}

test("code roles remain distinguishable and readable in Light and Dark", async () => {
  const css = await readTheme();
  const mappings = ruleBody(css, ".theme-light,\n.theme-dark");
  const syntaxRoles = [
    "--code-normal",
    "--code-comment",
    "--code-function",
    "--code-important",
    "--code-keyword",
    "--code-operator",
    "--code-property",
    "--code-punctuation",
    "--code-string",
    "--code-tag",
    "--code-value",
  ];

  for (const selector of [".theme-light", ".theme-dark"]) {
    const palette = ruleBody(css, selector);
    const values = new Map(
      [...`${mappings}\n${palette}`.matchAll(/(--[\w-]+):\s*([^;]+);/g)]
        .map(([, name, value]) => [name, value.trim()]),
    );
    function resolve(property, seen = new Set()) {
      assert.ok(!seen.has(property), `Cyclic color variable: ${property}`);
      seen.add(property);
      const value = values.get(property);
      assert.ok(value, `Missing color variable: ${property}`);
      const alias = value.match(/^var\((--[\w-]+)\)$/);
      if (alias) return resolve(alias[1], seen);
      assert.match(value, /^#[a-f\d]{6}$/i);
      return value.toLowerCase();
    }

    const background = resolve("--code-background");
    const activeWash = declaration(palette, "--pixel-active-line")
      .match(/^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/);
    assert.ok(activeWash, "Expected a translucent active-line wash over the code surface");
    const activeAlpha = Number(activeWash[4]);
    const activeBackground = "#" + [1, 3, 5].map((offset, index) => {
      const base = Number.parseInt(background.slice(offset, offset + 2), 16);
      return Math.round(Number(activeWash[index + 1]) * activeAlpha + base * (1 - activeAlpha))
        .toString(16).padStart(2, "0");
    }).join("");
    const selection = declaration(
      ruleBody(css, ".markdown-rendered,\n.markdown-source-view.mod-cm6"),
      "--text-selection",
    ).match(/^color-mix\(in srgb, var\((--[\w-]+)\) ([\d.]+)%, var\((--[\w-]+)\)\)$/);
    assert.ok(selection, "Expected an opaque selection surface over Pixel Paper");
    const [, ink, percentage, paper] = selection;
    const weight = Number(percentage) / 100;
    const selectionBackground = "#" + [1, 3, 5].map((offset) => {
      const channel = (role) => Number.parseInt(resolve(role).slice(offset, offset + 2), 16);
      return Math.round(channel(ink) * weight + channel(paper) * (1 - weight))
        .toString(16).padStart(2, "0");
    }).join("");
    for (const role of syntaxRoles) {
      assert.ok(
        contrast(resolve(role), background) >= 4.5,
        `${selector} ${role} must pass on its code background`,
      );
      assert.ok(
        contrast(resolve(role), selectionBackground) >= 4.5,
        `${selector} ${role} must remain readable when selected in the editor`,
      );
      assert.ok(
        contrast(resolve(role), activeBackground) >= 4.5,
        `${selector} ${role} must remain readable on an active code line`,
      );
    }

    const readingRoles = [
      "--code-normal", "--code-comment", "--code-keyword",
      "--code-string", "--code-function", "--code-value",
    ];
    assert.equal(
      new Set(readingRoles.map((role) => resolve(role))).size,
      readingRoles.length,
      `${selector} code must distinguish prose, comments, keywords, strings, functions and values`,
    );
    assert.ok(
      contrast(resolve("--code-comment"), background)
        < contrast(resolve("--code-normal"), background),
      `${selector} comments should be quieter than ordinary code`,
    );
    assert.equal(resolve("--code-punctuation"), resolve("--code-normal"));
    assert.equal(resolve("--code-operator"), resolve("--code-normal"));
  }

  assert.equal(
    declaration(
      ruleBody(
        css,
        ".markdown-source-view.mod-cm6 .code-block-flair,\n.markdown-rendered .code-block-flair",
      ),
      "color",
    ),
    "var(--pixel-text)",
  );
});

test("muted badges and empty states stay on Paper with meaningful boundaries", async () => {
  const css = await readTheme();
  const badges = ruleBody(css, ".nav-file-tag,\n.tree-item-flair,\n.tag-pane-tag-count");
  assert.equal(declaration(badges, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(badges, "color"), "var(--pixel-text-muted)");
  assert.equal(
    declaration(badges, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-border-meaningful)",
  );

  const empty = ruleBody(
    css,
    ".suggestion-empty,\n.empty-state-container,\n.search-empty-state,\n.bookmarks-pane-empty,\n.tag-pane-empty",
  );
  assert.equal(declaration(empty, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(empty, "color"), "var(--pixel-text-muted)");
  assert.match(declaration(empty, "border"), /dashed var\(--pixel-border-meaningful\)/);
});

test("keyboard-selected and directly focused controls expose the shared focus ring", async () => {
  const css = await readTheme();
  for (const selector of [
    ".menu-item:focus-visible",
    ".internal-link:focus-visible",
    ".tag:focus-visible",
    ".workspace-tab-header-container-inner:focus-visible",
    ".nav-files-container:focus-visible",
  ]) {
    const directFocus = ruleBodyForSelector(css, selector);
    assert.equal(
      declaration(directFocus, "outline"),
      "var(--pixel-border-control) solid var(--pixel-cyan)",
    );
    assert.equal(declaration(directFocus, "outline-offset"), "2px");
  }

  const keyboardSelection = ruleBody(
    css,
    ".suggestion-item.is-selected,\n.menu-item.is-selected",
  );
  assert.equal(
    declaration(keyboardSelection, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(keyboardSelection, "outline-offset"), "2px");
});

test("user font, size, accent, selection, and caret remain native variable contracts", async () => {
  const css = await readTheme();
  const body = combinedRuleBody(css, "body");
  const theme = ruleBody(css, ".theme-light,\n.theme-dark");
  const reading = ruleBody(
    css,
    ":where(.markdown-source-view.mod-cm6) .cm-content,\n.markdown-rendered",
  );

  assert.equal(declaration(body, "--font-text-theme"), "var(--pixel-font-text)");
  assert.equal(declaration(reading, "font-family"), "var(--font-text)");
  assert.equal(
    declaration(theme, "--interactive-accent"),
    "hsl(var(--accent-h), var(--accent-s), var(--accent-l))",
  );
  assert.equal(declaration(theme, "--text-selection"), "var(--pixel-selection)");
  assert.equal(declaration(theme, "--caret-color"), "var(--pixel-cyan)");
  assert.doesNotMatch(css, /\.cm-(?:editor|content)[^{]*\{[^}]*font-size:\s*\d+px/is);
});

test("adaptive preferences change presentation without redefining D1 or M1", async () => {
  const css = await readTheme();
  const reduced = atRuleBody(css, "@media (prefers-reduced-motion: reduce)");
  const forced = atRuleBody(css, "@media (forced-colors: active)");
  const stronger = atRuleBody(css, "@media (prefers-contrast: more)");

  assert.match(reduced, /transition-duration:\s*0m?s/);
  assert.match(reduced, /animation:\s*none/);
  assert.match(
    reduced,
    /body:not\(\.is-mobile\) \.workspace-leaf-resize-handle/,
  );
  assert.equal(
    declaration(ruleBodyForSelector(forced, ".theme-light"), "--pixel-paper"),
    "canvas",
  );
  assert.equal(
    declaration(
      ruleBodyForSelector(stronger, ".theme-light"),
      "--pixel-border-meaningful",
    ),
    "var(--pixel-text)",
  );
  assert.equal(
    declaration(
      ruleBodyForSelector(stronger, ".theme-light"),
      "--pixel-text-muted",
    ),
    "var(--pixel-text)",
  );
  for (const block of [reduced, forced, stronger]) {
    assert.doesNotMatch(block, /display:\s*none|position:\s*(?:fixed|absolute)/);
  }
});

test("selector and rendering exceptions stay bounded to documented native defects", async () => {
  const sources = await sourceStyles();
  const source = sources.join("\n");
  assert.doesNotMatch(source, /!important|@keyframes/);

  assert.doesNotMatch(source, /:has\s*\(/);
  assert.doesNotMatch(source, /clip-path\s*:/);
  assert.doesNotMatch(
    source,
    /\.dataview|\.kanban|\.tasks-|\.calendar-container|\.admonition|\.plugin-(?!properties\b)/i,
  );
  assert.match(
    source,
    /\.status-bar-item\.plugin-properties\s*\{[^}]*display:\s*none/is,
  );
});

test("the compatibility evidence matrix covers every required first-party surface", async () => {
  const matrix = await readFile(new URL("../COMPATIBILITY.md", import.meta.url), "utf8");
  for (const surface of [
    "Workspace shell",
    "Navigation dock",
    "Note context dock",
    "Source / Live Preview / Reading",
    "Native Markdown",
    "Controls / overlays / settings",
    "Graph",
    "Canvas",
    "Bases",
    "PDF",
    "D1 desktop / M1 mobile",
    "Official-variable plugin smoke",
  ]) {
    assert.match(matrix, new RegExp(`\\| ${surface.replaceAll("/", "\\/")} \\|`));
  }
});

test("Ticket 12 records every acceptance gate as complete with evidence", async () => {
  const matrix = await readFile(new URL("../COMPATIBILITY.md", import.meta.url), "utf8");
  assert.match(matrix, /## Ticket 12 completion record/);
  assert.match(matrix, /\*\*Ticket status:\*\* Complete/);

  const rows = [...matrix.matchAll(/^\| T12-(\d{2}) \| Pass \| ([^|]+) \|$/gm)];
  assert.deepEqual(
    rows.map((row) => row[1]),
    Array.from({ length: 13 }, (_, index) => String(index + 1).padStart(2, "0")),
  );
  for (const [, , evidence] of rows) {
    assert.match(evidence, /`[^`]+`|installed runtime|structural runtime/);
  }
});


test("property tag ink passes against its actual tinted background in both themes", async () => {
  const css = await readTheme();
  const scope = 'body:not(.is-mobile) .workspace.workspace .workspace-split.mod-root .workspace-leaf-content[data-type=markdown]';
  assert.equal(declaration(ruleBody(css, `${scope} .multi-select-pill`), "color"), "var(--pixel-tag-ink)");
  const ink = declaration(ruleBody(css, "body"), "--pixel-tag-ink");
  const match = ink.match(/^color-mix\(in srgb, var\(--pixel-cyan\) (\d+)%, var\(--pixel-text\)\)$/);
  assert.ok(match, "tag ink must derive from the shared palette");
  const weight = Number(match[1]) / 100;
  for (const mode of [".theme-light", ".theme-dark"]) {
    const palette = ruleBody(css, mode);
    const channels = role => declaration(palette, role).match(/[a-f\d]{2}/gi).map(v => parseInt(v, 16));
    const cyan = channels("--pixel-cyan");
    const text = channels("--pixel-text");
    const mixed = cyan.map((v, i) => Math.round(v * weight + text[i] * (1 - weight)).toString(16).padStart(2, "0")).join("");
    assert.ok(contrast(mixed, declaration(palette, "--pixel-nav-label")) >= 4.5, `${mode} property tag text must pass on its tint`);
  }
});

test("fenced editor comments and diff lines use readable syntax roles without recoloring prose", async () => {
  const css = await readTheme();
  const roles = {
    "cm-comment": "--code-comment",
    "cm-positive": "--code-string",
    "cm-negative": "--code-keyword",
  };
  for (const [token, role] of Object.entries(roles)) {
    const rule = ruleBodyForSelector(
      css,
      `.markdown-source-view.mod-cm6 .HyperMD-codeblock .${token}`,
    );
    assert.equal(declaration(rule, "color"), `var(${role})`);
  }
  assert.equal(
    declaration(ruleBodyForSelector(css, ".cm-comment"), "color"),
    "var(--pixel-text-muted)",
  );
});

test("print code keeps distinct syntax ink readable with and without background graphics", async () => {
  const css = await readTheme();
  const print = ruleBody(atRuleBody(css, "@media print"), ".print");
  const roles = [
    "normal", "comment", "function", "important", "keyword", "operator",
    "property", "punctuation", "string", "tag", "value",
  ];
  const colors = new Map(roles.map(role => [role, declaration(print, `--code-${role}`)]));
  for (const background of [declaration(print, "--code-background"), "#ffffff"]) {
    for (const [role, color] of colors) {
      assert.ok(contrast(color, background) >= 4.5, `Printed ${role} must pass on ${background}`);
    }
  }
  // Export must not collapse the new syntax roles back into prose and amber.
  const distinctRoles = ["normal", "comment", "keyword", "string", "function", "value"];
  assert.equal(new Set(distinctRoles.map(role => colors.get(role))).size, distinctRoles.length);
});
