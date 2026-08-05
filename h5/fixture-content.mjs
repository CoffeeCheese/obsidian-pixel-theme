import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

const sha256Pattern = /^[a-f0-9]{64}$/;

function assertObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

export function validateFixtureContentCatalog(contentCatalog) {
  assertObject(contentCatalog, "fixture content catalog");
  if (contentCatalog.schemaVersion !== 1) {
    throw new TypeError("fixture content schemaVersion must be 1");
  }
  if (!/^\d+\.\d+\.\d+$/.test(contentCatalog.fixtureVersion)) {
    throw new TypeError("fixture content fixtureVersion must use exact SemVer");
  }
  assertObject(contentCatalog.content, "fixture content");

  for (const [contentId, entry] of Object.entries(contentCatalog.content)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(contentId)) {
      throw new TypeError(`fixture content id ${contentId} must be kebab-case`);
    }
    assertObject(entry, `fixture content ${contentId}`);
    if (Object.keys(entry).length !== 1 || !Array.isArray(entry.files)) {
      throw new TypeError(`fixture content ${contentId} must contain only files`);
    }
    if (entry.files.length === 0) {
      throw new TypeError(`fixture content ${contentId} files must not be empty`);
    }
    const seen = new Set();
    for (const file of entry.files) {
      assertObject(file, `fixture content ${contentId} file`);
      if (
        Object.keys(file).length !== 2 ||
        typeof file.path !== "string" ||
        file.path.trim() === "" ||
        path.isAbsolute(file.path) ||
        path.normalize(file.path).startsWith("..")
      ) {
        throw new TypeError(
          `fixture content ${contentId} file path must stay inside the Vault`,
        );
      }
      if (!sha256Pattern.test(file.sha256)) {
        throw new TypeError(
          `fixture content ${contentId} file sha256 must be lowercase SHA-256`,
        );
      }
      if (seen.has(file.path)) {
        throw new TypeError(`fixture content ${contentId} repeats ${file.path}`);
      }
      seen.add(file.path);
    }
  }
  return contentCatalog;
}

export async function readFixtureContentCatalog(catalogUrl) {
  const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));
  return validateFixtureContentCatalog(catalog);
}

export async function verifyFixtureContent({
  vaultPath,
  contentCatalog,
  requiredContentIds,
}) {
  const validated = validateFixtureContentCatalog(contentCatalog);
  const realVaultPath = await realpath(vaultPath);
  const verified = [];

  for (const contentId of requiredContentIds) {
    const entry = validated.content[contentId];
    if (!entry) throw new Error(`fixture content catalog is missing ${contentId}`);
    for (const file of entry.files) {
      const requestedPath = path.resolve(realVaultPath, file.path);
      const relative = path.relative(realVaultPath, requestedPath);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error(`fixture content ${file.path} leaves the dedicated Vault`);
      }
      const realFilePath = await realpath(requestedPath);
      const realRelative = path.relative(realVaultPath, realFilePath);
      if (realRelative.startsWith("..") || path.isAbsolute(realRelative)) {
        throw new Error(`fixture content ${file.path} traverses a symbolic link`);
      }
      const actualHash = createHash("sha256")
        .update(await readFile(realFilePath))
        .digest("hex");
      if (actualHash !== file.sha256) {
        throw new Error(
          `fixture content ${file.path} SHA-256 mismatch for ${contentId}`,
        );
      }
    }
    verified.push(contentId);
  }
  return verified;
}
