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
import {
  narrowDesktopMediaQuery,
  narrowWorkspaceSpacing,
} from "../test-support/h5-contract.mjs";

const readPackageJson = (name) =>
  readFile(new URL(`../${name}`, import.meta.url), "utf8").then(JSON.parse);

function flatRules(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: match[1].split(",").map((selector) => selector.trim()),
    body: match[2],
  }));
}

function semanticRuleBody(css, requiredFragments) {
  const rule = flatRules(css).find(({ selectors }) =>
    selectors.some((selector) =>
      requiredFragments.every((fragment) => selector.includes(fragment)),
    ),
  );
  assert.ok(
    rule,
    `expected a compiled rule containing ${requiredFragments.join(", ")}`,
  );
  return rule.body;
}

test("installable package is the sole H5 product observation boundary", async () => {
  const [css, manifest] = await Promise.all([
    readTheme(),
    readPackageJson("manifest.json"),
  ]);

  assert.equal(manifest.name, "Pixel");
  assert.equal(manifest.minAppVersion, "1.12.0");
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.ok(css.startsWith("/*!\n * Pixel\n"));
  assert.doesNotMatch(css, /src\/scss|prototypes\/|fixture-catalog\.mjs/i);
});

test("compiled H5 package keeps semantic material ownership explicit", async () => {
  const css = await readTheme();
  const mappings = ruleBody(css, ".theme-light,\n.theme-dark");
  const workspace = ruleBody(css, "body:not(.is-mobile) .workspace");
  const navigation = semanticRuleBody(css, [
    "body:not(.is-mobile)",
    ".mod-left-split",
    ".workspace-tab-header-container",
  ]);
  const context = semanticRuleBody(css, [
    "body:not(.is-mobile)",
    ".mod-right-split",
    ".workspace-tab-header-container",
  ]);
  const cockpit = semanticRuleBody(css, [
    "body:not(.is-mobile)",
    ".mod-root",
    ".workspace-tabs",
  ]);
  const screen = semanticRuleBody(css, [
    "body:not(.is-mobile)",
    ".mod-root",
    ".view-content",
  ]);

  assert.equal(declaration(mappings, "--background-primary"), "var(--pixel-paper)");
  assert.equal(declaration(workspace, "background-color"), "var(--pixel-canvas)");
  assert.equal(declaration(navigation, "background-color"), "var(--pixel-nav-label)");
  assert.equal(declaration(context, "background-color"), "var(--pixel-context-label)");
  assert.equal(declaration(cockpit, "background-color"), "var(--pixel-surface-secondary)");
  assert.equal(declaration(screen, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(screen, "text-shadow"), "none");
});

test("compiled H5 package pins canonical and narrow desktop geometry", async () => {
  const css = await readTheme();
  const body = ruleBody(css, "body");
  const canonicalGap = Number.parseFloat(declaration(body, "--pixel-workspace-gap"));
  const canonicalInset = Number.parseFloat(
    declaration(body, "--pixel-workspace-inset"),
  );

  assert.ok(canonicalGap >= 10 && canonicalGap <= 14);
  assert.ok(canonicalInset >= 10 && canonicalInset <= 14);
  assert.equal(declaration(body, "--pixel-workspace-grid-size"), "24px");

  const narrow = atRuleBody(css, narrowDesktopMediaQuery);
  const narrowBody = ruleBody(narrow, "body:not(.is-mobile)");
  assert.equal(
    declaration(narrowBody, "--pixel-workspace-gap"),
    narrowWorkspaceSpacing,
  );
  assert.equal(
    declaration(narrowBody, "--pixel-workspace-inset"),
    narrowWorkspaceSpacing,
  );
  assert.doesNotMatch(narrow, /workspace-drawer/i);
  assert.doesNotMatch(narrow, /workspace-split[^{}]*\{[^}]*display:\s*none/is);
});

test("compiled H5 package preserves accessibility modes without topology changes", async () => {
  const css = await readTheme();
  const reduced = atRuleBody(css, "@media (prefers-reduced-motion: reduce)");
  const forced = atRuleBody(css, "@media (forced-colors: active)");
  const stronger = atRuleBody(css, "@media (prefers-contrast: more)");

  assert.match(reduced, /transition-duration:\s*0m?s/);
  assert.equal(
    declaration(ruleBodyForSelector(forced, ".theme-light"), "--pixel-paper"),
    "canvas",
  );
  for (const shadowRole of [
    "--pixel-shadow-side-module",
    "--pixel-shadow-cockpit",
    "--pixel-shadow-buffer",
  ]) {
    assert.equal(
      declaration(ruleBodyForSelector(forced, ".theme-light"), shadowRole),
      "none",
    );
  }
  assert.equal(
    declaration(
      ruleBodyForSelector(stronger, ".theme-light"),
      "--pixel-border-meaningful",
    ),
    "var(--pixel-text)",
  );
  for (const mode of [reduced, forced, stronger]) {
    assert.doesNotMatch(mode, /workspace-(?:split|drawer)[^{}]*\{[^}]*display:\s*none/is);
  }
});

test("compiled H5 package forbids forced panes and hidden native actions", async () => {
  const css = await readTheme();

  for (const rule of flatRules(css)) {
    if (
      rule.selectors.some((selector) =>
        /body:not\(\.is-mobile\).*\.workspace-split\.mod-(?:left|right)-split(?::not\([^)]*\))?$/.test(
          selector,
        ),
      )
    ) {
      assert.doesNotMatch(
        rule.body,
        /(?:^|;)\s*(?:(?:min|max)-)?(?:inline-size|width)\s*:|(?:^|;)\s*flex-basis\s*:/i,
      );
    }

    if (
      rule.selectors.some((selector) =>
        [
          "workspace-tab-header-inner-close-button",
          "view-actions",
          "sidebar-toggle-button",
        ].some((nativeAction) => selector.includes(nativeAction)),
      )
    ) {
      assert.doesNotMatch(
        rule.body,
        /(?:display:\s*none|visibility:\s*hidden|pointer-events:\s*none|opacity:\s*0(?:\.0+)?\s*(?:;|$)|clip-path\s*:|(?:inline-size|block-size|width|height):\s*0(?:px)?\s*(?:;|$))/i,
      );
    }
  }

  assert.doesNotMatch(css, /\.dataview|\.kanban|\.tasks-|\.calendar-container|\.plugin-/i);
});

test("compiled H5 package rejects shell ownership drift", async () => {
  const css = await readTheme();
  const rootSplit = ruleBody(css, "body:not(.is-mobile) .workspace-split.mod-root");
  const cockpit = ruleBody(
    css,
    "body:not(.is-mobile) .workspace-split.mod-root .workspace-tabs",
  );
  const workspace = ruleBody(css, "body:not(.is-mobile) .workspace");

  assert.doesNotMatch(rootSplit, /(?:border|border-radius|box-shadow)\s*:/i);
  assert.equal(
    declaration(cockpit, "box-shadow"),
    "var(--pixel-shadow-cockpit)",
  );
  assert.equal(
    declaration(cockpit, "border-radius"),
    "var(--pixel-cockpit-contour)",
  );
  assert.equal(
    declaration(workspace, "background-size"),
    "var(--pixel-workspace-grid-size) var(--pixel-workspace-grid-size)",
  );

  for (const rule of flatRules(css)) {
    if (/border-radius:\s*var\(--pixel-cockpit-contour\)/i.test(rule.body)) {
      assert.ok(
        rule.selectors.every((selector) =>
          selector.includes(".workspace-split.mod-root .workspace-tabs"),
        ),
        "the asymmetric contour must remain exclusive to Cockpit Units",
      );
    }
    if (/background-size:\s*var\(--pixel-workspace-grid-size\)/i.test(rule.body)) {
      assert.deepEqual(rule.selectors, ["body:not(.is-mobile) .workspace"]);
    }
  }
});

test("compiled H5 package remains self-contained and within package budgets", async () => {
  const [css, manifest] = await Promise.all([
    readTheme(),
    readPackageJson("manifest.json"),
  ]);
  const fontPayloads = [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/gi)].flatMap(
    (fontFace) =>
      [...fontFace[1].matchAll(/base64,([^"')]+)/gi)].map((match) => match[1]),
  );

  assert.ok(Buffer.byteLength(css) <= Math.floor(1.5 * 1024 * 1024));
  assert.ok(
    fontPayloads.reduce((total, payload) => total + Buffer.byteLength(payload), 0) <=
      Math.floor(1.2 * 1024 * 1024),
  );
  assert.equal(fontPayloads.length, 3);
  assert.match(manifest.minAppVersion, /^\d+\.\d+\.\d+$/);
  assert.doesNotMatch(css, /@import\b/i);
  assert.doesNotMatch(css, /url\(["']?(?:https?:|\/\/)/i);
});
