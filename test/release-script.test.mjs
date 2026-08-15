import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  compareVersions,
  normalizeVersion,
  prepareRelease,
  verifyRelease,
} from "../scripts/release.mjs";

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function createFixture(t, version = "0.9.0") {
  const root = await mkdtemp(path.join(tmpdir(), "pixel-release-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "docs", "releases"), { recursive: true });
  await Promise.all([
    writeJson(path.join(root, "manifest.json"), {
      name: "Pixel",
      version,
      minAppVersion: "1.12.0",
      author: "CoffeeCheese",
    }),
    writeJson(path.join(root, "versions.json"), { [version]: "1.12.0" }),
    writeFile(
      path.join(root, "README.md"),
      `Pixel <!-- pixel-version:start -->${version}<!-- pixel-version:end -->\n`,
      "utf8",
    ),
    writeFile(
      path.join(root, "README.zh-CN.md"),
      `Pixel <!-- pixel-version:start -->${version}<!-- pixel-version:end -->\n`,
      "utf8",
    ),
  ]);
  return root;
}

async function completeNotes(root, version, ios = "Pass") {
  const replacements = [
    ["请填写本版本最重要的用户可见变化。", "改进主题的发布与升级体验。"],
    ["请填写新增、调整和修复内容。", "增加可复现的版本发布流程。"],
    ["Describe the most important user-visible change in this release.", "Improved the theme release and update experience."],
    ["Describe additions, refinements, and fixes.", "Added a reproducible version publishing workflow."],
    ["自动化测试：Pending", "自动化测试：Pass"],
    ["桌面人工检查：Pending", "桌面人工检查：Pass"],
    ["iOS 人工检查：Pending", `iOS 人工检查：${ios}`],
    ["Automated tests: Pending", "Automated tests: Pass"],
    ["Desktop manual check: Pending", "Desktop manual check: Pass"],
    ["iOS manual check: Pending", `iOS manual check: ${ios}`],
  ];
  for (const suffix of [".md", ".en.md"]) {
    const filePath = path.join(root, "docs", "releases", `${version}${suffix}`);
    let contents = await readFile(filePath, "utf8");
    for (const [from, to] of replacements) contents = contents.replace(from, to);
    await writeFile(filePath, contents, "utf8");
  }
}

test("release versions use exact unprefixed SemVer ordering", () => {
  assert.equal(normalizeVersion("0.9.0"), "0.9.0");
  assert.throws(() => normalizeVersion("v0.9.0"), /without a v prefix/);
  assert.throws(() => normalizeVersion("0.9"), /exact x\.y\.z/);
  assert.equal(compareVersions("0.9.1", "0.9.0"), 1);
  assert.equal(compareVersions("0.10.0", "0.9.9"), 1);
  assert.equal(compareVersions("1.0.0", "1.0.0"), 0);
});

test("prepare updates both version sources, READMEs, and bilingual notes", async (t) => {
  const root = await createFixture(t);
  const result = await prepareRelease("0.9.1", { root, runChecks: false });
  const [manifest, versions, readme, readmeEnglish, chinese, english] =
    await Promise.all([
      readFile(path.join(root, "manifest.json"), "utf8").then(JSON.parse),
      readFile(path.join(root, "versions.json"), "utf8").then(JSON.parse),
      readFile(path.join(root, "README.md"), "utf8"),
      readFile(path.join(root, "README.zh-CN.md"), "utf8"),
      readFile(path.join(root, "docs/releases/0.9.1.md"), "utf8"),
      readFile(path.join(root, "docs/releases/0.9.1.en.md"), "utf8"),
    ]);

  assert.deepEqual(result, {
    currentVersion: "0.9.0",
    nextVersion: "0.9.1",
    minAppVersion: "1.12.0",
  });
  assert.equal(manifest.version, "0.9.1");
  assert.deepEqual(versions, { "0.9.0": "1.12.0", "0.9.1": "1.12.0" });
  assert.match(readme, /0\.9\.1/);
  assert.match(readmeEnglish, /0\.9\.1/);
  assert.match(chinese, /0\.9\.1\.en\.md/);
  assert.match(english, /0\.9\.1\.md/);
  assert.doesNotMatch(chinese, /Android/i);
  assert.doesNotMatch(english, /Android/i);
});

test("prepare refuses version reuse, regression, and note overwrites", async (t) => {
  const root = await createFixture(t);
  await assert.rejects(
    prepareRelease("0.9.0", { root, runChecks: false }),
    /must be greater/,
  );
  await writeFile(
    path.join(root, "docs", "releases", "0.9.1.md"),
    "existing notes\n",
    "utf8",
  );
  await assert.rejects(
    prepareRelease("0.9.1", { root, runChecks: false }),
    /will not be overwritten/,
  );
});

test("verify requires completed bilingual notes and lightweight manual gates", async (t) => {
  const root = await createFixture(t);
  await prepareRelease("0.9.1", { root, runChecks: false });
  await assert.rejects(verifyRelease("0.9.1", { root }), /completed release information/);
  await completeNotes(root, "0.9.1", "Not required");
  assert.equal((await verifyRelease("0.9.1", { root })).version, "0.9.1");
  await assert.rejects(verifyRelease("v0.9.1", { root }), /without a v prefix/);
  await assert.rejects(verifyRelease("0.9.2", { root }), /must match manifest/);
});

test("initial and minor releases require an iOS Pass", async (t) => {
  const root = await createFixture(t, "0.8.9");
  await prepareRelease("0.9.0", { root, runChecks: false });
  await completeNotes(root, "0.9.0", "Not required");
  await assert.rejects(verifyRelease("0.9.0", { root }), /iOS 人工检查 must be Pass/);
});
