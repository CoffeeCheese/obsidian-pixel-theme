import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export async function readTheme() {
  return readFile(path.join(repositoryRoot, "theme.css"), "utf8");
}

export function matchingRuleBodies(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [
    ...css.matchAll(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`, "g")),
  ];
  assert.ok(matches.length > 0, `Expected compiled theme.css to contain ${selector}`);
  return matches.map((match) => match[1]);
}

export function ruleBody(css, selector) {
  return matchingRuleBodies(css, selector)[0];
}

export function combinedRuleBody(css, selector) {
  return matchingRuleBodies(css, selector).join("\n");
}

export function declaration(body, property) {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(
    new RegExp(`(?:^|[;\\n])\\s*${escapedProperty}:\\s*([^;]+);`),
  );
  assert.ok(match, `Expected ${property} in compiled rule`);
  return match[1].trim().toLowerCase();
}

export function ruleBodyForSelector(css, selector) {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const rule = rules.find((match) =>
    match[1]
      .split(",")
      .map((candidate) => candidate.trim())
      .includes(selector),
  );
  assert.ok(rule, `Expected compiled rule containing ${selector}`);
  return rule[2];
}

export function atRuleBody(css, prelude) {
  const start = css.indexOf(prelude);
  assert.notEqual(start, -1, `Expected compiled theme.css to contain ${prelude}`);
  const openingBrace = css.indexOf("{", start);
  let depth = 1;

  for (let index = openingBrace + 1; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return css.slice(openingBrace + 1, index);
  }

  assert.fail(`Expected ${prelude} to have a closing brace`);
}
