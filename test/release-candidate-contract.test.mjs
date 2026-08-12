import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (relativePath) => readFile(new URL(relativePath, root), "utf8");
const readBytes = (relativePath) => readFile(new URL(relativePath, root));

test("release version, compatibility floor, tag, and two install assets agree", async () => {
  const [manifest, versions, workflow] = await Promise.all([
    read("manifest.json").then(JSON.parse),
    read("versions.json").then(JSON.parse),
    read(".github/workflows/release.yml"),
  ]);

  assert.equal(manifest.name, "Pixel");
  assert.equal(manifest.version, "0.9.0");
  assert.equal(manifest.minAppVersion, "1.12.0");
  assert.equal(versions[manifest.version], manifest.minAppVersion);
  assert.match(workflow, /tags:\s*\n\s*- "\*\.\*\.\*"/);
  assert.match(workflow, /gh release upload "\$RELEASE_TAG" theme\.css manifest\.json/);
  assert.match(workflow, /--draft=false/);
  assert.match(workflow, /--prerelease=false/);
  assert.match(workflow, /--latest/);
  assert.doesNotMatch(workflow, /community|obsidianmd\/obsidian-releases/i);
});

test("release package is self-contained and carries redistribution notices", async () => {
  const css = await read("theme.css");
  const fontPayloads = [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/gi)].flatMap(
    (fontFace) =>
      [...fontFace[1].matchAll(/base64,([^"')]+)/gi)].map((match) => match[1]),
  );
  const encodedFontBytes = fontPayloads.reduce(
    (total, payload) => total + Buffer.byteLength(payload),
    0,
  );

  assert.equal(fontPayloads.length, 3);
  assert.ok(encodedFontBytes <= Math.floor(1.2 * 1024 * 1024));
  assert.ok(Buffer.byteLength(css) <= Math.floor(1.5 * 1024 * 1024));
  assert.doesNotMatch(css, /@import\b/i);
  for (const match of css.matchAll(/url\(([^)]*)\)/gi)) {
    const value = match[1].trim().replace(/^(["'])(.*)\1$/, "$2");
    assert.match(value, /^(?:data:|#)/i);
  }
  assert.doesNotMatch(css, /dev-test|773da17a65bacca8|\/Users\/|prototypes\//i);
  assert.match(css, /Pixel theme — MIT License/);
  assert.match(css, /Permission is hereby granted, free of charge/);
  assert.match(css, /Fusion Pixel — SIL Open Font License 1\.1/);
  assert.match(css, /JetBrains Mono — SIL Open Font License 1\.1/);
  assert.equal((css.match(/SIL OPEN FONT LICENSE Version 1\.1/gi) || []).length, 2);
});

test("bundled font attribution matches the redistributed files", async () => {
  const expected = {
    "src/assets/fonts/fusion-pixel-12px-proportional-zh_hans.woff2":
      "9d8d2f0bae6214568c591c72f4f3e8cbc39b2eeda461861e521e45d966ccefac",
    "src/assets/fonts/JetBrainsMono-Regular.woff2":
      "a9cb1cd82332b23a47e3a1239d25d13c86d16c4220695e34b243effa999f45f2",
    "src/assets/fonts/JetBrainsMono-Bold.woff2":
      "c503cc5ec5f8b2c7666b7ecda1adf44bd45f2e6579b2eba0fc292150416588a2",
  };

  for (const [file, checksum] of Object.entries(expected)) {
    const actual = createHash("sha256").update(await readBytes(file)).digest("hex");
    assert.equal(actual, checksum);
  }

  const [mit, sources, fusionLicense, jetBrainsLicense] = await Promise.all([
    read("LICENSE"),
    read("src/assets/fonts/SOURCES.md"),
    read("src/assets/fonts/licenses/Fusion-Pixel-OFL-1.1.txt"),
    read("src/assets/fonts/licenses/JetBrains-Mono-OFL-1.1.txt"),
  ]);
  assert.match(mit, /MIT License/);
  assert.match(sources, /Fusion Pixel 2026\.07\.20/);
  assert.match(sources, /JetBrains Mono 2\.304/);
  for (const license of [fusionLicense, jetBrainsLicense]) {
    assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/i);
  }
});

test("tag-only CI runs the complete verification path before public release", async () => {
  const workflow = await read(".github/workflows/release.yml");
  const commands = [
    "npm ci",
    "npm run build",
    "git diff --exit-code -- theme.css",
    "npm test",
    "npm run check",
    "npm run release:verify",
    "actions/attest-build-provenance@",
    "gh release create",
    "gh release upload",
    "--draft=false",
  ];
  for (let index = 1; index < commands.length; index += 1) {
    assert.ok(
      workflow.indexOf(commands[index - 1]) < workflow.indexOf(commands[index]),
      `${commands[index - 1]} must run before ${commands[index]}`,
    );
  }
  assert.match(workflow, /git merge-base --is-ancestor "\$GITHUB_SHA" refs\/remotes\/origin\/main/);
  assert.match(workflow, /main manifest .* does not match release tag/);
  assert.doesNotMatch(workflow, /workflow_dispatch|pull_request|schedule:/);

  const actionUses = [...workflow.matchAll(/uses:\s*([^\s#]+)/g)].map((match) => match[1]);
  assert.equal(actionUses.length, 3);
  for (const action of actionUses) assert.match(action, /^[^@]+@[a-f0-9]{40}$/);

  await assert.rejects(read(".github/workflows/check.yml"), /ENOENT/);
});

test("documentation separates historical evidence, release operations, and bilingual notes", async () => {
  const [readme, readmeEnglish, releasing, archived, chinese, english, devicePlan, issueTemplate, screenshot] =
    await Promise.all([
      read("README.md"),
      read("README.en.md"),
      read("docs/RELEASING.md"),
      read("docs/archive/0.1.0-release-candidate.md"),
      read("docs/releases/0.9.0.md"),
      read("docs/releases/0.9.0.en.md"),
      read("DEVICE_TEST_PLAN.md"),
      read(".github/ISSUE_TEMPLATE/theme-bug.yml"),
      readBytes("screenshot.png"),
    ]);

  assert.match(readme, /README\.en\.md/);
  assert.match(readmeEnglish, /README\.md/);
  assert.match(releasing, /git push --atomic origin main 0\.9\.1/);
  assert.match(releasing, /community\.obsidian\.md/);
  assert.match(archived, /historical/i);
  assert.match(chinese, /0\.9\.0\.en\.md/);
  assert.match(english, /0\.9\.0\.md/);
  assert.match(chinese, /Android：Unverified/);
  assert.match(english, /Android: Unverified/);
  assert.match(devicePlan, /Android.*Unverified/is);
  assert.match(issueTemplate, /Pixel version/);
  assert.match(issueTemplate, /Obsidian version/);
  assert.match(issueTemplate, /Android \(unverified\)/);
  assert.equal(screenshot.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(screenshot.readUInt32BE(16), 512);
  assert.equal(screenshot.readUInt32BE(20), 288);
  assert.doesNotMatch(readme, /DESKTOP \/ MOBILE/);
  assert.doesNotMatch(readmeEnglish, /DESKTOP \/ MOBILE/);
});
