import assert from "node:assert/strict";
import test from "node:test";
import { atRuleBody, readTheme } from "../test-support/theme-css.mjs";

const boundary = '@scope (body) to (.workspace-leaf-content[data-type="claudian-view"] > .view-content)';

test("Claudian owns its message bubbles, composer and responsive layout", async () => {
  const css = await readTheme();
  // 2.2.7 moved the user bubble into message-content and replaced textarea
  // with CodeMirror. Theme selectors must not depend on either DOM version.
  assert.doesNotMatch(css, /\.claudian-[\w-]+/);
  assert.doesNotMatch(css, /pixel-claudian/);
});

test("shared control geometry and interaction states stop at the plugin content boundary", async () => {
  const css = await readTheme();
  const scopes = css.split(boundary).slice(1).map((part) =>
    atRuleBody(`${boundary}${part}`, boundary),
  );
  assert.equal(scopes.length, 2, "both shared controls and disabled states need the boundary");
  assert.match(scopes[0], /min-block-size:\s*var\(--pixel-control-min\)/);
  assert.match(scopes[0], /button:focus-visible/);
  assert.match(scopes[0], /textarea:not\(/);
  assert.match(scopes[0], /input\[type=search\]/);
  assert.match(scopes[1], /button:disabled/);
  assert.match(scopes[1], /cursor:\s*not-allowed/);
  // The limit is the plugin content, leaving Obsidian's view header outside.
  assert.match(boundary, /> \.view-content\)/);
  assert.doesNotMatch(css, /all:\s*(?:unset|initial|revert)\s*;/);
});
