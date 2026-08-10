import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (relativePath) => readFile(new URL(relativePath, root), "utf8");
const readBytes = (relativePath) => readFile(new URL(relativePath, root));

test("release version, compatibility floor, and two-file draft agree", async () => {
  const [manifest, versions, workflow] = await Promise.all([
    read("manifest.json").then(JSON.parse),
    read("versions.json").then(JSON.parse),
    read(".github/workflows/release.yml"),
  ]);

  assert.equal(manifest.name, "Pixel");
  assert.equal(manifest.minAppVersion, "1.12.0");
  assert.equal(versions[manifest.version], manifest.minAppVersion);
  assert.match(workflow, /gh release create "\$GITHUB_REF_NAME"\s+theme\.css manifest\.json/);
  assert.match(workflow, /--draft/);
  assert.match(workflow, /--verify-tag/);
  assert.doesNotMatch(workflow, /community|publish|obsidianmd\/obsidian-releases/i);
});

test("release candidate is self-contained and carries redistribution notices", async () => {
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

test("CI and draft release run the complete locked verification path", async () => {
  const workflows = {
    ".github/workflows/check.yml":
      "npm run visual:h5 -- --verify-approval",
    ".github/workflows/release.yml":
      "npm run visual:h5 -- --verify-approval --require-approval",
  };
  for (const [file, approvalCommand] of Object.entries(workflows)) {
    const workflow = await read(file);
    assert.match(workflow, /node-version:\s*24/);
    assert.match(workflow, /- run: npm ci/);
    assert.match(workflow, /- run: npm run build/);
    assert.match(workflow, /- run: git diff --exit-code -- theme\.css/);
    assert.match(workflow, /- run: npm test/);
    assert.match(workflow, /- run: npm run check/);
    assert.ok(workflow.includes(`- run: ${approvalCommand}`));
    assert.ok(workflow.indexOf("npm ci") < workflow.indexOf("npm run build"));
    assert.ok(
      workflow.indexOf("npm run build") <
        workflow.indexOf("git diff --exit-code -- theme.css"),
    );
    assert.ok(
      workflow.indexOf("git diff --exit-code -- theme.css") <
        workflow.indexOf("npm test"),
    );
    assert.ok(workflow.indexOf("npm test") < workflow.indexOf("npm run check"));
    assert.ok(
      workflow.indexOf("npm run check") < workflow.indexOf(approvalCommand),
    );
  }
});

test("routine development does not automatically trigger GitHub Actions", async () => {
  const [check, release] = await Promise.all([
    read(".github/workflows/check.yml"),
    read(".github/workflows/release.yml"),
  ]);

  assert.match(check, /^on:\s*\n  workflow_dispatch:\s*$/m);
  assert.doesNotMatch(check, /^  (?:push|pull_request):/m);
  assert.match(release, /^on:\s*\n  push:\s*\n    tags:\s*\n      - "\*\.\*\.\*"/m);
});

test("tagged draft verifies a required exact-artifact approval before creation", async () => {
  const workflow = await read(".github/workflows/release.yml");
  const approval = "npm run visual:h5 -- --verify-approval --require-approval";

  assert.ok(workflow.indexOf("npm run build") < workflow.indexOf(approval));
  assert.ok(workflow.indexOf(approval) < workflow.indexOf("gh release create"));
});

test("handoff documents separate prepared artifacts from pending manual validation", async () => {
  const [manifest, readme, candidate, devices, ignore] = await Promise.all([
    read("manifest.json").then(JSON.parse),
    read("README.md"),
    read("RELEASE_CANDIDATE.md"),
    read("DEVICE_TEST_PLAN.md"),
    read(".gitignore"),
  ]);

  assert.ok(
    candidate.startsWith(`# Pixel ${manifest.version} release-candidate handoff\n`),
  );
  assert.match(readme, /H5 material system, D1 balanced desktop layout, and M1/);
  assert.match(readme, /Node\.js 24/);
  assert.match(readme, /1\.2 MiB/);
  assert.match(readme, /1\.5 MiB/);
  assert.match(readme, /no plugin-specific selectors/i);
  assert.match(readme, /Prototype markup, JavaScript state, simulated controls/);
  assert.match(candidate, /Automated package gate:\s*Pass/);
  assert.match(candidate, /Manual desktop acceptance:\s*Pending/);
  assert.match(candidate, /Physical iOS and Android:\s*Pending/);
  assert.match(candidate, /Public publication has \*\*not\*\* been performed/);
  assert.match(devices, /iOS \| Phone/);
  assert.match(devices, /Android \| Tablet/);
  assert.match(devices, /iPhone Mirroring/);
  assert.match(devices, /evidence\/ticket-13\/devices\//);
  assert.match(ignore, /^\/?\.scratch\/$/m);
  assert.match(ignore, /^evidence\/$/m);
  assert.match(ignore, /^prototypes\/$/m);
});
