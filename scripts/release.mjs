#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const repositoryUrl = "https://github.com/CoffeeCheese/obsidian-pixel-theme";

function fail(message) {
  throw new Error(message);
}

export function normalizeVersion(value) {
  const version = String(value ?? "").trim();
  if (!semverPattern.test(version)) {
    fail(`Version must use exact x.y.z SemVer without a v prefix: ${value}`);
  }
  return version;
}

function versionParts(version) {
  return normalizeVersion(version).split(".").map(Number);
}

export function compareVersions(left, right) {
  const leftParts = versionParts(left);
  const rightParts = versionParts(right);
  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] < rightParts[index] ? -1 : 1;
    }
  }
  return 0;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function releasePaths(root, version) {
  const releaseDirectory = path.join(root, "docs", "releases");
  return {
    releaseDirectory,
    chinese: path.join(releaseDirectory, `${version}.md`),
    english: path.join(releaseDirectory, `${version}.en.md`),
  };
}

function chineseTemplate(version) {
  return `<p align="right"><a href="${repositoryUrl}/blob/${version}/docs/releases/${version}.en.md">English</a> · 中文</p>

# Pixel ${version}

## 更新亮点

- 请填写本版本最重要的用户可见变化。

## 更新内容

- 请填写新增、调整和修复内容。

## 兼容性

- 最低 Obsidian 版本：\`1.12.0\`
- 已验证平台：桌面端、iOS
- 未验证平台：Android

## 已知问题

- 暂无已知问题。

## 发布验收

- 自动化测试：Pending
- 桌面人工检查：Pending
- iOS 人工检查：Pending
- Android：Unverified
`;
}

function englishTemplate(version) {
  return `<p align="right">English · <a href="${repositoryUrl}/blob/${version}/docs/releases/${version}.md">中文</a></p>

# Pixel ${version}

## Highlights

- Describe the most important user-visible change in this release.

## Changes

- Describe additions, refinements, and fixes.

## Compatibility

- Minimum Obsidian version: \`1.12.0\`
- Verified platforms: desktop and iOS
- Unverified platform: Android

## Known issues

- No known issues.

## Release validation

- Automated tests: Pending
- Desktop manual check: Pending
- iOS manual check: Pending
- Android: Unverified
`;
}

async function assertMissing(filePath) {
  try {
    await readFile(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  fail(`Release notes already exist and will not be overwritten: ${filePath}`);
}

async function updatedReadmes(root, currentVersion, nextVersion) {
  const updates = [];
  for (const fileName of ["README.md", "README.en.md"]) {
    const filePath = path.join(root, fileName);
    const contents = await readFile(filePath, "utf8");
    const marker = `<!-- pixel-version:start -->${currentVersion}<!-- pixel-version:end -->`;
    if (!contents.includes(marker)) {
      fail(`${fileName} does not contain the current-version marker for ${currentVersion}`);
    }
    const nextMarker = `<!-- pixel-version:start -->${nextVersion}<!-- pixel-version:end -->`;
    const updated = contents
      .split(marker)
      .join(nextMarker)
      .split(`docs/releases/${currentVersion}.md`)
      .join(`docs/releases/${nextVersion}.md`)
      .split(`docs/releases/${currentVersion}.en.md`)
      .join(`docs/releases/${nextVersion}.en.md`);
    updates.push({ filePath, contents: updated });
  }
  return updates;
}

function run(command, args, root) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

function runLocalVerification(root) {
  run("npm", ["run", "build"], root);
  run("npm", ["test"], root);
  run("npm", ["run", "check"], root);
}

export async function prepareRelease(versionInput, options = {}) {
  const root = path.resolve(options.root ?? repositoryRoot);
  const nextVersion = normalizeVersion(versionInput);
  const manifestPath = path.join(root, "manifest.json");
  const versionsPath = path.join(root, "versions.json");
  const manifest = await readJson(manifestPath);
  const versions = await readJson(versionsPath);
  const currentVersion = normalizeVersion(manifest.version);
  normalizeVersion(manifest.minAppVersion);

  if (compareVersions(nextVersion, currentVersion) <= 0) {
    fail(`New version ${nextVersion} must be greater than ${currentVersion}`);
  }
  if (Object.hasOwn(versions, nextVersion)) {
    fail(`versions.json already contains ${nextVersion}`);
  }

  const paths = releasePaths(root, nextVersion);
  await Promise.all([assertMissing(paths.chinese), assertMissing(paths.english)]);
  const readmeUpdates = await updatedReadmes(root, currentVersion, nextVersion);

  manifest.version = nextVersion;
  versions[nextVersion] = manifest.minAppVersion;
  await mkdir(paths.releaseDirectory, { recursive: true });
  await Promise.all([
    writeJson(manifestPath, manifest),
    writeJson(versionsPath, versions),
    writeFile(paths.chinese, chineseTemplate(nextVersion), "utf8"),
    writeFile(paths.english, englishTemplate(nextVersion), "utf8"),
    ...readmeUpdates.map(({ filePath, contents }) =>
      writeFile(filePath, contents, "utf8"),
    ),
  ]);

  if (options.runChecks !== false) runLocalVerification(root);
  return { currentVersion, nextVersion, minAppVersion: manifest.minAppVersion };
}

function section(markdown, heading) {
  const start = markdown.indexOf(`${heading}\n`);
  if (start < 0) fail(`Missing release notes section: ${heading}`);
  const contentStart = start + heading.length + 1;
  const nextHeading = markdown.indexOf("\n## ", contentStart);
  return markdown.slice(contentStart, nextHeading < 0 ? undefined : nextHeading);
}

function assertSubstantiveBullets(markdown, heading) {
  const bullets = section(markdown, heading)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "));
  if (bullets.length === 0 || bullets.some((line) => /请填写|Describe the/i.test(line))) {
    fail(`${heading} must contain completed release information`);
  }
}

function checklistValue(markdown, label) {
  const match = markdown.match(new RegExp(`^- ${label}[：:]\\s*(.+)$`, "m"));
  if (!match) fail(`Missing release validation item: ${label}`);
  return match[1].trim();
}

function assertChecklist(markdown, version, language) {
  const [, , patch] = versionParts(version);
  const requiresFullIos = version === "0.9.0" || patch === 0;
  const labels = language === "zh"
    ? {
        automated: "自动化测试",
        desktop: "桌面人工检查",
        ios: "iOS 人工检查",
        android: "Android",
      }
    : {
        automated: "Automated tests",
        desktop: "Desktop manual check",
        ios: "iOS manual check",
        android: "Android",
      };
  const allowedIos = requiresFullIos ? new Set(["Pass"]) : new Set(["Pass", "Not required"]);

  if (checklistValue(markdown, labels.automated) !== "Pass") {
    fail(`${labels.automated} must be Pass`);
  }
  if (checklistValue(markdown, labels.desktop) !== "Pass") {
    fail(`${labels.desktop} must be Pass`);
  }
  const ios = checklistValue(markdown, labels.ios);
  if (!allowedIos.has(ios)) {
    fail(`${labels.ios} must be ${[...allowedIos].join(" or ")}`);
  }
  if (checklistValue(markdown, labels.android) !== "Unverified") {
    fail(`${labels.android} must remain Unverified until physical validation exists`);
  }
}

export async function verifyRelease(versionInput, options = {}) {
  const root = path.resolve(options.root ?? repositoryRoot);
  const tag = normalizeVersion(versionInput);
  const manifest = await readJson(path.join(root, "manifest.json"));
  const versions = await readJson(path.join(root, "versions.json"));
  const version = normalizeVersion(manifest.version);
  const minAppVersion = normalizeVersion(manifest.minAppVersion);
  if (tag !== version) fail(`Release tag ${tag} must match manifest version ${version}`);
  if (versions[version] !== minAppVersion) {
    fail(`versions.json must map ${version} to ${minAppVersion}`);
  }

  const paths = releasePaths(root, version);
  const [chinese, english] = await Promise.all([
    readFile(paths.chinese, "utf8"),
    readFile(paths.english, "utf8"),
  ]);
  if (!chinese.startsWith(`<p align="right"><a href="${repositoryUrl}/blob/${version}/docs/releases/${version}.en.md">English</a> · 中文</p>`)) {
    fail("Chinese release notes must link to the English document");
  }
  if (!english.startsWith(`<p align="right">English · <a href="${repositoryUrl}/blob/${version}/docs/releases/${version}.md">中文</a></p>`)) {
    fail("English release notes must link to the Chinese document");
  }
  if (!chinese.includes(`# Pixel ${version}\n`) || !english.includes(`# Pixel ${version}\n`)) {
    fail(`Both release note titles must match Pixel ${version}`);
  }
  assertSubstantiveBullets(chinese, "## 更新亮点");
  assertSubstantiveBullets(english, "## Highlights");
  for (const heading of ["## 更新内容", "## 兼容性", "## 已知问题", "## 发布验收"]) {
    section(chinese, heading);
  }
  for (const heading of ["## Changes", "## Compatibility", "## Known issues", "## Release validation"]) {
    section(english, heading);
  }
  assertChecklist(chinese, version, "zh");
  assertChecklist(english, version, "en");
  return { version, minAppVersion, notes: paths };
}

function usage() {
  return `Usage:
  npm run release:prepare -- <x.y.z>
  npm run release:verify -- <x.y.z>`;
}

async function main() {
  const [command, version, ...extra] = process.argv.slice(2);
  if (!command || !version || extra.length > 0 || !["prepare", "verify"].includes(command)) {
    fail(usage());
  }
  if (command === "prepare") {
    const result = await prepareRelease(version);
    process.stdout.write(`Prepared Pixel ${result.nextVersion}. Review and complete both release-note checklists before tagging.\n`);
  } else {
    const result = await verifyRelease(version);
    process.stdout.write(`Verified Pixel ${result.version} release metadata and manual checklist.\n`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
