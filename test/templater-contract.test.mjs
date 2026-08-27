import assert from "node:assert/strict";
import test from "node:test";
import {
  atRuleBody,
  declaration,
  readTheme,
  ruleBody,
} from "../test-support/theme-css.mjs";

const promptInput =
  ".modal .templater-prompt-div > .templater-prompt-input";

function combinedAtRuleBody(css, prelude) {
  const bodies = [];
  let offset = 0;
  let start = css.indexOf(prelude, offset);

  while (start !== -1) {
    bodies.push(atRuleBody(css.slice(start), prelude));
    offset = start + prelude.length;
    start = css.indexOf(prelude, offset);
  }

  return bodies.join("\n");
}

test("Templater prompts use a quiet hairline edge instead of the global control frame", async () => {
  const css = await readTheme();
  const input = ruleBody(css, promptInput);

  assert.equal(
    declaration(input, "border"),
    "var(--pixel-border-decoration) solid color-mix(in srgb, var(--pixel-cyan) 22%, var(--pixel-line-strong))",
  );
  assert.equal(declaration(input, "box-shadow"), "none");
  assert.equal(declaration(input, "caret-color"), "var(--pixel-cyan)");

  const focus = ruleBody(
    css,
    `${promptInput}:is(:focus, :focus-visible)`,
  );
  assert.equal(
    declaration(focus, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(focus, "outline"), "0");
  assert.equal(declaration(focus, "box-shadow"), "none");
  assert.equal(
    declaration(focus, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 6%, var(--pixel-paper))",
  );

  const reducedMotion = combinedAtRuleBody(
    css,
    "@media (prefers-reduced-motion: reduce)",
  );
  assert.equal(
    declaration(ruleBody(reducedMotion, promptInput), "transition"),
    "none",
  );

  const forcedColors = combinedAtRuleBody(
    css,
    "@media (forced-colors: active)",
  );
  const forcedFocus = ruleBody(
    forcedColors,
    `${promptInput}:is(:focus, :focus-visible)`,
  );
  assert.equal(declaration(forcedFocus, "border-color"), "highlight");
  assert.equal(
    declaration(forcedFocus, "outline"),
    "var(--pixel-border-decoration) solid highlight",
  );
});
