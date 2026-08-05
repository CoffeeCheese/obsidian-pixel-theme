import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  readFixtureContentCatalog,
  validateFixtureContentCatalog,
  verifyFixtureContent,
} from "../h5/fixture-content.mjs";

const catalogUrl = new URL("../h5/fixture-content.v1.json", import.meta.url);

test("fixture content catalog pins every content id used by the H5 matrix", async () => {
  const [contentCatalog, fixtureCatalog] = await Promise.all([
    readFixtureContentCatalog(catalogUrl),
    readFile(new URL("../h5/fixtures.v1.json", import.meta.url), "utf8").then(
      JSON.parse,
    ),
  ]);
  const requiredIds = [
    ...new Set(
      fixtureCatalog.fixtures.flatMap((fixture) => fixture.requiredContentIds),
    ),
  ];

  assert.equal(contentCatalog.fixtureVersion, fixtureCatalog.fixtureVersion);
  assert.deepEqual(
    Object.keys(contentCatalog.content).sort(),
    requiredIds.sort(),
  );
  for (const entry of Object.values(contentCatalog.content)) {
    assert.ok(entry.files.length > 0);
    for (const file of entry.files) {
      assert.match(file.sha256, /^[a-f0-9]{64}$/);
      assert.equal(path.isAbsolute(file.path), false);
    }
  }
});

test("fixture content validation rejects paths outside the Vault and malformed hashes", async () => {
  const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));

  const escaped = structuredClone(catalog);
  escaped.content["h5-reader-bilingual"].files[0].path = "../personal.md";
  assert.throws(
    () => validateFixtureContentCatalog(escaped),
    /path must stay inside the Vault/,
  );

  const malformed = structuredClone(catalog);
  malformed.content["h5-reader-bilingual"].files[0].sha256 = "latest";
  assert.throws(
    () => validateFixtureContentCatalog(malformed),
    /sha256 must be lowercase SHA-256/,
  );
});

test("fixture content verification fails closed when controlled bytes change", async () => {
  const vaultPath = await mkdtemp(path.join(tmpdir(), "pixel-h5-vault-"));
  try {
    await mkdir(path.join(vaultPath, "Fixtures"));
    await writeFile(path.join(vaultPath, "Fixtures", "Reader.md"), "known fixture\n");
    const contentCatalog = {
      schemaVersion: 1,
      fixtureVersion: "1.0.0",
      content: {
        "h5-reader-bilingual": {
          files: [
            {
              path: "Fixtures/Reader.md",
              sha256:
                "89b81ba7f7c298c638749a9bd44760e6d1572ceafae72d7e82ec751565a479ad",
            },
          ],
        },
      },
    };

    assert.deepEqual(
      await verifyFixtureContent({
        vaultPath,
        contentCatalog,
        requiredContentIds: ["h5-reader-bilingual"],
      }),
      ["h5-reader-bilingual"],
    );

    await writeFile(path.join(vaultPath, "Fixtures", "Reader.md"), "changed\n");
    await assert.rejects(
      verifyFixtureContent({
        vaultPath,
        contentCatalog,
        requiredContentIds: ["h5-reader-bilingual"],
      }),
      /SHA-256 mismatch/,
    );
  } finally {
    await rm(vaultPath, { recursive: true, force: true });
  }
});
