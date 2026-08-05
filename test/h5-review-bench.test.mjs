import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { H5_APPROVAL_OBJECTIVE_CHECKS } from "../h5/approval.mjs";
import { readFixtureCatalog } from "../h5/fixture-catalog.mjs";
import { writeReviewBench } from "../h5/review-bench.mjs";

const packageIdentity = {
  themeName: "Pixel",
  themeVersion: "0.1.0",
  themeCssSha256: "a".repeat(64),
  manifestSha256: "b".repeat(64),
};

const environmentIdentity = {
  obsidianVersion: "1.12.7",
  platform: "desktop",
  zoomFactor: 1,
  activeTheme: "Pixel",
  vault: { id: "fixture-vault", path: "/fixture-vault", dedicated: true },
  profile: { path: "/fixture-profile", dedicated: true },
};

async function withRunDirectory(callback) {
  const runDirectory = await mkdtemp(path.join(tmpdir(), "pixel-h5-bench-test-"));
  try {
    return await callback(runDirectory);
  } finally {
    await rm(runDirectory, { recursive: true, force: true });
  }
}

async function createBench(runDirectory, options = {}) {
  const catalog = await readFixtureCatalog(
    new URL("../h5/fixtures.v1.json", import.meta.url),
  );
  const selectedFixtures = options.fixtures || catalog.fixtures;
  const evidence = [];
  for (const fixture of selectedFixtures) {
    const evidencePath = path.join(runDirectory, `${fixture.id}.png`);
    await writeFile(evidencePath, fixture.id);
    evidence.push({ fixture, evidencePath });
  }
  const benchPath = await writeReviewBench({
    runDirectory,
    catalog,
    evidence,
    packageIdentity,
    environmentIdentity,
    source: {
      commit: "c".repeat(40),
      dirty: false,
      author: "Theme Implementer",
    },
    capturedAt: "2026-08-05T04:00:00.000Z",
    objectiveResults: H5_APPROVAL_OBJECTIVE_CHECKS.map((check) => ({
      check,
      result: "Pass",
    })),
  });
  return {
    benchPath,
    catalog,
    html: await readFile(benchPath, "utf8"),
  };
}

function visibleText(html) {
  return html
    .replace(/<style>[\s\S]*?<\/style>/g, " ")
    .replace(/<script>[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

test("review bench binds all ten captured views to exact build and environment identity", async () => {
  await withRunDirectory(async (runDirectory) => {
    const { benchPath, catalog, html } = await createBench(runDirectory);

    assert.equal(benchPath, path.join(runDirectory, "review.html"));
    for (const fixture of catalog.fixtures) {
      assert.match(html, new RegExp(`${fixture.id}\\.png`, "g"));
    }
    const text = visibleText(html);
    assert.match(text, /aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/);
    assert.match(text, /cccccccccccccccccccccccccccccccccccccccc/);
    assert.match(text, /Obsidian 1\.12\.7.*active theme Pixel/);
    assert.match(text, /Vault fixture-vault.*dedicated/);
    assert.match(text, /Fixture 1\.0\.0/);
    assert.match(text, /Rubric 1\.0\.0/);
  });
});

test("review bench groups states and offers non-scoring comparison tools", async () => {
  await withRunDirectory(async (runDirectory) => {
    const { html } = await createBench(runDirectory);
    const text = visibleText(html);

    for (const label of [
      "Canonical states",
      "Narrow continuity",
      "Single unit",
      "Split units",
      "Side by side",
      "Synchronized zoom",
      "Overlay",
      "Difference localization",
    ]) {
      assert.match(text, new RegExp(label));
    }
    const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
    assert.ok(script);
    assert.doesNotThrow(() => new Function(script));
    assert.doesNotMatch(html, /toDataURL|localStorage|data:image/i);
    assert.doesNotMatch(
      text,
      /acceptance percentage|similarity score|perceptual score|pixel[- ]diff threshold|snapshot equal/i,
    );
  });
});

test("full matrix exposes six named-owner gates and an independent H5 identity judgment", async () => {
  await withRunDirectory(async (runDirectory) => {
    const { html } = await createBench(runDirectory);
    const text = visibleText(html);

    for (const gate of [
      "Workspace composition and tab topology",
      "Material depth and contour",
      "Semantic signal colors",
      "Typography and geometry",
      "Restrained H5 hardware identity",
      "Four-state identity continuity",
    ]) {
      assert.match(text, new RegExp(gate));
    }
    assert.match(text, /Owner decision Pass Revise Fail/);
    assert.match(text, /Finding fixture/);
    assert.match(text, /Finding region/);
    assert.match(text, /Localized finding/);
    assert.match(text, /H5 Identity.*Approved Rejected/);
    assert.match(text, /Named visual owner/);
    assert.match(text, /Theme Implementer/);
    assert.match(text, /Automation · facts only/);
    assert.match(text, /Download Approved attestation/);
    assert.match(
      text,
      /Only a fully passing named-owner review can export canonical approval JSON/,
    );
    assert.match(
      text,
      /Revise or Fail requires a fixture, region, and finding/,
    );
    assert.match(
      text,
      /Visual owner must differ from automation and source-author identities/,
    );
    assert.doesNotMatch(text, /Pass selected|Approved selected/);
    assert.match(html, /pixel-h5-exact-artifact-approval/);
  });
});

test("focused rerun remains diagnostic-only and cannot record approval decisions", async () => {
  await withRunDirectory(async (runDirectory) => {
    const catalog = await readFixtureCatalog(
      new URL("../h5/fixtures.v1.json", import.meta.url),
    );
    const { html } = await createBench(runDirectory, {
      fixtures: [catalog.fixtures[0]],
    });
    const text = visibleText(html);

    assert.match(text, /Focused diagnostic rerun/);
    assert.match(text, /full ten-view run is required to record decisions/i);
    assert.doesNotMatch(
      text,
      /Named visual owner|Owner decision|Approved Revise Rejected|Copy text review draft|Download Approved attestation/,
    );
  });
});
