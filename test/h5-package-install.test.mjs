import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertSafeThemeDirectory,
  installPackageFiles,
  packageHashes,
  readPackageFiles,
} from "../h5/package-install.mjs";

async function fixtureVault() {
  const vaultPath = await mkdtemp(path.join(tmpdir(), "pixel-h5-package-"));
  const themeDirectory = path.join(
    vaultPath,
    ".obsidian",
    "themes",
    "Pixel",
  );
  await mkdir(themeDirectory, { recursive: true });
  await writeFile(path.join(themeDirectory, "theme.css"), "old css");
  await writeFile(path.join(themeDirectory, "manifest.json"), "old manifest");
  return { vaultPath, themeDirectory };
}

test("exact package install replaces only the two Pixel package files", async () => {
  const { vaultPath, themeDirectory } = await fixtureVault();
  try {
    await writeFile(path.join(themeDirectory, "keep.txt"), "preserve me");
    await assertSafeThemeDirectory(vaultPath, themeDirectory);
    await installPackageFiles(themeDirectory, {
      themeCss: Buffer.from("exact css"),
      manifest: Buffer.from("exact manifest"),
    });

    assert.deepEqual(
      Object.fromEntries(
        Object.entries(await readPackageFiles(themeDirectory)).map(
          ([key, value]) => [key, value.toString("utf8")],
        ),
      ),
      { themeCss: "exact css", manifest: "exact manifest" },
    );
    assert.equal(await readFile(path.join(themeDirectory, "keep.txt"), "utf8"), "preserve me");
    assert.deepEqual(packageHashes(await readPackageFiles(themeDirectory)), {
      themeCssSha256:
        "3a8cc3a58f482f52cbd29f14df01ff9d3dfa9a87f41d0123eef3b66ba7596bbf",
      manifestSha256:
        "cbd09e5f1e546666f2b7d3fb1bb681882b6593ddb5703466b31b70b4dc7042a7",
    });
  } finally {
    await rm(vaultPath, { recursive: true, force: true });
  }
});

test("package install rejects a symlinked Pixel destination", async () => {
  const { vaultPath, themeDirectory } = await fixtureVault();
  const outside = await mkdtemp(path.join(tmpdir(), "pixel-h5-outside-"));
  try {
    await rm(themeDirectory, { recursive: true });
    await symlink(outside, themeDirectory);
    await assert.rejects(
      assertSafeThemeDirectory(vaultPath, themeDirectory),
      /must not traverse symbolic links/,
    );
  } finally {
    await rm(vaultPath, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
