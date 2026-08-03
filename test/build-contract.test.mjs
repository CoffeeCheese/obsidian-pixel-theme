import assert from "node:assert/strict";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const { vaultId: dedicatedVaultId } = JSON.parse(
  await readFile(path.join(repositoryRoot, "development.json"), "utf8"),
);

async function createPackageFixture(t) {
  const fixtureRoot = await mkdtemp(
    path.join(repositoryRoot, ".build-contract-fixture-"),
  );
  t.after(() => rm(fixtureRoot, { recursive: true, force: true }));

  await Promise.all(
    [
      "build.mjs",
      "development.json",
      "manifest.json",
      "versions.json",
      "theme.css",
      "src",
    ].map(
      (name) =>
        cp(path.join(repositoryRoot, name), path.join(fixtureRoot, name), {
          recursive: true,
        }),
    ),
  );

  return fixtureRoot;
}

function buildEnvironment(overrides = {}) {
  return {
    ...process.env,
    GITHUB_REF_NAME: "",
    GITHUB_REF_TYPE: "",
    OBSIDIAN_THEME_DIR: "",
    ...overrides,
  };
}

function runBuild(fixtureRoot, args = [], environment = {}) {
  const result = spawnSync(
    process.execPath,
    [path.join(fixtureRoot, "build.mjs"), ...args],
    {
      cwd: fixtureRoot,
      encoding: "utf8",
      env: buildEnvironment(environment),
    },
  );

  return {
    ...result,
    output: `${result.stdout}${result.stderr}`,
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function createDeploymentEnvironment(
  fixtureRoot,
  vaultRoot,
  vaultId = dedicatedVaultId,
) {
  const fakeHome = path.join(fixtureRoot, "fake-home");
  const environment = {
    HOME: fakeHome,
    APPDATA: path.join(fakeHome, "AppData", "Roaming"),
    XDG_CONFIG_HOME: path.join(fakeHome, ".config"),
  };
  const registryPaths = [
    path.join(
      fakeHome,
      "Library",
      "Application Support",
      "obsidian",
      "obsidian.json",
    ),
    path.join(
      environment.APPDATA,
      "obsidian",
      "obsidian.json",
    ),
    path.join(
      environment.XDG_CONFIG_HOME,
      "obsidian",
      "obsidian.json",
    ),
  ];
  const registry = {
    vaults: {
      [vaultId]: { path: vaultRoot },
    },
  };
  await Promise.all(
    registryPaths.map(async (registryPath) => {
      await mkdir(path.dirname(registryPath), { recursive: true });
      await writeJson(registryPath, registry);
    }),
  );

  return environment;
}

async function waitForOutput(readOutput, pattern, timeoutMs = 8000) {
  const startedAt = Date.now();

  while (!pattern.test(readOutput())) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Timed out waiting for ${pattern}:\n${readOutput()}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

test("build is deterministic and check accepts the generated package", async (t) => {
  const fixtureRoot = await createPackageFixture(t);

  const firstBuild = runBuild(fixtureRoot);
  assert.equal(firstBuild.status, 0, firstBuild.output);
  const firstArtifact = await readFile(path.join(fixtureRoot, "theme.css"), "utf8");

  const secondBuild = runBuild(fixtureRoot);
  assert.equal(secondBuild.status, 0, secondBuild.output);
  assert.equal(
    await readFile(path.join(fixtureRoot, "theme.css"), "utf8"),
    firstArtifact,
  );

  const check = runBuild(fixtureRoot, ["--check"]);
  assert.equal(check.status, 0, check.output);
  assert.match(check.output, /generated artifact are consistent/);
});

test("check rejects an empty required manifest field", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const manifestPath = path.join(fixtureRoot, "manifest.json");
  const manifest = await readJson(manifestPath);
  manifest.author = "";
  await writeJson(manifestPath, manifest);

  const result = runBuild(fixtureRoot, ["--check"]);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /manifest\.json requires a non-empty author/);
});

test("check rejects a non-exact manifest SemVer", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const manifestPath = path.join(fixtureRoot, "manifest.json");
  const manifest = await readJson(manifestPath);
  manifest.version = "0.1";
  await writeJson(manifestPath, manifest);

  const result = runBuild(fixtureRoot, ["--check"]);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /manifest version must use exact x\.y\.z SemVer/);
});

test("check rejects SemVer components with leading zeroes", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const manifestPath = path.join(fixtureRoot, "manifest.json");
  const manifest = await readJson(manifestPath);
  manifest.version = "01.2.3";
  await writeJson(manifestPath, manifest);

  const result = runBuild(fixtureRoot, ["--check"]);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /manifest version must use exact x\.y\.z SemVer/);
});

test("check rejects a release tag that differs from the manifest version", async (t) => {
  const fixtureRoot = await createPackageFixture(t);

  const result = runBuild(fixtureRoot, ["--check"], {
    GITHUB_REF_NAME: "0.2.0",
    GITHUB_REF_TYPE: "tag",
  });

  assert.notEqual(result.status, 0);
  assert.match(
    result.output,
    /release tag 0\.2\.0 does not match manifest version 0\.1\.0/,
  );
});

test("check rejects a compatibility map missing the current theme version", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const versionsPath = path.join(fixtureRoot, "versions.json");
  const versions = await readJson(versionsPath);
  delete versions["0.1.0"];
  await writeJson(versionsPath, versions);

  const result = runBuild(fixtureRoot, ["--check"]);

  assert.notEqual(result.status, 0);
  assert.match(
    result.output,
    /versions\.json must map current theme version 0\.1\.0 to minAppVersion 1\.12\.0/,
  );
});

test("check rejects a compatibility map that disagrees with minAppVersion", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const versionsPath = path.join(fixtureRoot, "versions.json");
  const versions = await readJson(versionsPath);
  versions["0.1.0"] = "1.11.0";
  await writeJson(versionsPath, versions);

  const result = runBuild(fixtureRoot, ["--check"]);

  assert.notEqual(result.status, 0);
  assert.match(
    result.output,
    /versions\.json must map current theme version 0\.1\.0 to minAppVersion 1\.12\.0/,
  );
});

test("build rejects encoded font payload above 1.2 MiB", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const entryPath = path.join(fixtureRoot, "src/scss/index.scss");
  const source = await readFile(entryPath, "utf8");
  const encodedFont = "A".repeat(Math.floor(1.2 * 1024 * 1024) + 1);
  await writeFile(
    entryPath,
    `${source}\n@font-face { font-family: Fixture; src: url("data:font/woff2;base64,${encodedFont}"); }\n`,
    "utf8",
  );

  const result = runBuild(fixtureRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /encoded font payload exceeds 1\.2 MiB budget/i);
});

test("build counts legacy data-URI MIME types toward the encoded font budget", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const entryPath = path.join(fixtureRoot, "src/scss/index.scss");
  const source = await readFile(entryPath, "utf8");
  const encodedFont = "A".repeat(Math.floor(1.2 * 1024 * 1024) + 1);
  await writeFile(
    entryPath,
    `${source}\n@font-face { font-family: Fixture; src: url("data:application/font-woff;base64,${encodedFont}"); }\n`,
    "utf8",
  );

  const result = runBuild(fixtureRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /encoded font payload exceeds 1\.2 MiB budget/i);
});

test("build rejects generated CSS above 1.5 MiB", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const entryPath = path.join(fixtureRoot, "src/scss/index.scss");
  const oversizedValue = "x".repeat(Math.floor(1.5 * 1024 * 1024));
  await writeFile(
    entryPath,
    `:root { --oversized-fixture: "${oversizedValue}"; }\n`,
    "utf8",
  );

  const result = runBuild(fixtureRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /generated theme\.css exceeds 1\.5 MiB budget/i);
});

test("check rejects runtime HTTP URLs in the compiled stylesheet", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const entryPath = path.join(fixtureRoot, "src/scss/index.scss");
  const source = await readFile(entryPath, "utf8");
  await writeFile(
    entryPath,
    `${source}\n.runtime-request { background-image: url("https://example.com/pixel.png"); }\n`,
    "utf8",
  );

  const result = runBuild(fixtureRoot, ["--check"]);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /must not load runtime assets from the network/);
});

test("check rejects runtime HTTP imports in the compiled stylesheet", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const entryPath = path.join(fixtureRoot, "src/scss/index.scss");
  const source = await readFile(entryPath, "utf8");
  await writeFile(
    entryPath,
    `${source}\n@import url("http://example.com/runtime.css");\n`,
    "utf8",
  );

  const result = runBuild(fixtureRoot, ["--check"]);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /compiled theme\.css must not contain @import/);
});

test("check rejects runtime HTTP URLs separated from the scheme by a CSS comment", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const entryPath = path.join(fixtureRoot, "src/scss/index.scss");
  const source = await readFile(entryPath, "utf8");
  await writeFile(
    entryPath,
    `${source}\n.runtime-request { background-image: url(/*comment*/https://example.com/pixel.png); }\n`,
    "utf8",
  );

  const result = runBuild(fixtureRoot, ["--check"]);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /must not load runtime assets from the network/);
});

test("check rejects non-embedded relative runtime assets", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const entryPath = path.join(fixtureRoot, "src/scss/index.scss");
  const source = await readFile(entryPath, "utf8");
  await writeFile(
    entryPath,
    `${source}\n.runtime-request { background-image: url("./pixel.png"); }\n`,
    "utf8",
  );

  const result = runBuild(fixtureRoot, ["--check"]);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /runtime assets must be embedded as data URLs/);
});

test("check rejects escaped runtime imports", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const entryPath = path.join(fixtureRoot, "src/scss/index.scss");
  const source = await readFile(entryPath, "utf8");
  await writeFile(
    entryPath,
    `${source}\n@import "h\\74 tps://example.com/runtime.css";\n`,
    "utf8",
  );

  const result = runBuild(fixtureRoot, ["--check"]);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /compiled theme\.css must not contain @import/);
});

test("check rejects runtime image-set assets", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const entryPath = path.join(fixtureRoot, "src/scss/index.scss");
  const source = await readFile(entryPath, "utf8");
  await writeFile(
    entryPath,
    `${source}\n.runtime-request { background-image: image-set("./pixel.png" 1x); }\n`,
    "utf8",
  );

  const result = runBuild(fixtureRoot, ["--check"]);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /compiled theme\.css must not contain image-set/);
});

test("build allows an HTTP URL when it is inert text rather than a runtime asset", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const entryPath = path.join(fixtureRoot, "src/scss/index.scss");
  const source = await readFile(entryPath, "utf8");
  await writeFile(
    entryPath,
    `${source}\n.safe-text::before { content: "https://example.com/docs"; }\n`,
    "utf8",
  );

  const result = runBuild(fixtureRoot);

  assert.equal(result.status, 0, result.output);
  assert.match(
    await readFile(path.join(fixtureRoot, "theme.css"), "utf8"),
    /content: "https:\/\/example\.com\/docs"/,
  );
});

test("check rejects a stale committed stylesheet", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const outputPath = path.join(fixtureRoot, "theme.css");
  await writeFile(outputPath, "/* stale */\n", "utf8");

  const result = runBuild(fixtureRoot, ["--check"]);

  assert.notEqual(result.status, 0);
  assert.match(result.output, /theme\.css is stale; run npm run build/);
});

test("deployment rejects a relative theme destination", async (t) => {
  const fixtureRoot = await createPackageFixture(t);

  const result = runBuild(fixtureRoot, [], {
    OBSIDIAN_THEME_DIR: ".obsidian/themes/Pixel",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.output, /OBSIDIAN_THEME_DIR must be an absolute path/);
});

test("deployment rejects a theme destination that redirects through a symlink", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const themesRoot = path.join(fixtureRoot, "dev-test", ".obsidian", "themes");
  const unrelatedDirectory = path.join(fixtureRoot, "unrelated-data");
  const destination = path.join(themesRoot, "Pixel");
  await mkdir(themesRoot, { recursive: true });
  await mkdir(unrelatedDirectory, { recursive: true });
  await writeFile(path.join(unrelatedDirectory, "keep.txt"), "keep\n", "utf8");
  await symlink(unrelatedDirectory, destination);
  const deploymentEnvironment = await createDeploymentEnvironment(
    fixtureRoot,
    path.join(fixtureRoot, "dev-test"),
  );

  const result = runBuild(fixtureRoot, [], {
    ...deploymentEnvironment,
    OBSIDIAN_THEME_DIR: destination,
  });

  assert.notEqual(result.status, 0);
  assert.match(result.output, /theme destination must not traverse symbolic links/);
  assert.equal(await readFile(path.join(unrelatedDirectory, "keep.txt"), "utf8"), "keep\n");
  await assert.rejects(readFile(path.join(unrelatedDirectory, "theme.css")));
  await assert.rejects(readFile(path.join(unrelatedDirectory, "manifest.json")));
});

test("deployment rejects a destination outside the configured dedicated Vault", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const dedicatedVault = path.join(fixtureRoot, "dev-test");
  const otherDestination = path.join(
    fixtureRoot,
    "other-vault",
    ".obsidian",
    "themes",
    "Pixel",
  );
  const deploymentEnvironment = await createDeploymentEnvironment(
    fixtureRoot,
    dedicatedVault,
  );

  const result = runBuild(fixtureRoot, [], {
    ...deploymentEnvironment,
    OBSIDIAN_THEME_DIR: otherDestination,
  });

  assert.notEqual(result.status, 0);
  assert.match(
    result.output,
    /OBSIDIAN_THEME_DIR must target the Pixel theme in the configured dedicated Vault/,
  );
});

test("deployment rejects a Vault ID other than the dedicated dev-test Vault", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const vaultRoot = path.join(fixtureRoot, "dev-test");
  const destination = path.join(vaultRoot, ".obsidian", "themes", "Pixel");
  const deploymentEnvironment = await createDeploymentEnvironment(
    fixtureRoot,
    vaultRoot,
    "another-vault-id",
  );

  const result = runBuild(fixtureRoot, [], {
    ...deploymentEnvironment,
    OBSIDIAN_THEME_DIR: destination,
  });

  assert.notEqual(result.status, 0);
  assert.match(
    result.output,
    /Obsidian Vault registry does not contain dev-test Vault ID/,
  );
});

test("deployment rejects a symlinked ancestor below the dedicated Vault", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const vaultRoot = path.join(fixtureRoot, "dev-test");
  const obsidianRoot = path.join(vaultRoot, ".obsidian");
  const unrelatedDirectory = path.join(fixtureRoot, "unrelated-themes");
  const destination = path.join(obsidianRoot, "themes", "Pixel");
  await mkdir(obsidianRoot, { recursive: true });
  await mkdir(unrelatedDirectory, { recursive: true });
  await symlink(unrelatedDirectory, path.join(obsidianRoot, "themes"));
  const deploymentEnvironment = await createDeploymentEnvironment(
    fixtureRoot,
    vaultRoot,
  );

  const result = runBuild(fixtureRoot, [], {
    ...deploymentEnvironment,
    OBSIDIAN_THEME_DIR: destination,
  });

  assert.notEqual(result.status, 0);
  assert.match(result.output, /theme destination must not traverse symbolic links/);
  await assert.rejects(readFile(path.join(unrelatedDirectory, "Pixel", "theme.css")));
});

test("deployment replaces package-file symlinks without altering other Vault data", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const vaultRoot = path.join(fixtureRoot, "dev-test");
  const destination = path.join(
    vaultRoot,
    ".obsidian",
    "themes",
    "Pixel",
  );
  const unrelatedNote = path.join(vaultRoot, "Unrelated note.md");
  await mkdir(destination, { recursive: true });
  await writeFile(unrelatedNote, "must remain unchanged\n", "utf8");
  await writeFile(path.join(destination, "keep.txt"), "keep\n", "utf8");
  await symlink(unrelatedNote, path.join(destination, "theme.css"));
  const deploymentEnvironment = await createDeploymentEnvironment(
    fixtureRoot,
    vaultRoot,
  );

  const result = runBuild(fixtureRoot, [], {
    ...deploymentEnvironment,
    OBSIDIAN_THEME_DIR: destination,
  });

  assert.equal(result.status, 0, result.output);
  assert.equal(await readFile(unrelatedNote, "utf8"), "must remain unchanged\n");
  assert.equal(await readFile(path.join(destination, "keep.txt"), "utf8"), "keep\n");
  assert.equal(
    await readFile(path.join(destination, "theme.css"), "utf8"),
    await readFile(path.join(fixtureRoot, "theme.css"), "utf8"),
  );
  assert.deepEqual(
    await readJson(path.join(destination, "manifest.json")),
    await readJson(path.join(fixtureRoot, "manifest.json")),
  );
  assert.deepEqual((await readdir(destination)).sort(), [
    "keep.txt",
    "manifest.json",
    "theme.css",
  ]);
});

test("watch mode recovers from a build error and rebuilds after a valid change", async (t) => {
  const fixtureRoot = await createPackageFixture(t);
  const entryPath = path.join(fixtureRoot, "src/scss/index.scss");
  await writeFile(entryPath, ":root {\n", "utf8");

  const watcher = spawn(process.execPath, [path.join(fixtureRoot, "build.mjs"), "--watch"], {
    cwd: fixtureRoot,
    env: buildEnvironment(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  watcher.stdout.on("data", (chunk) => {
    output += chunk;
  });
  watcher.stderr.on("data", (chunk) => {
    output += chunk;
  });
  t.after(() => {
    if (watcher.exitCode === null) watcher.kill("SIGTERM");
  });

  await waitForOutput(() => output, /Build failed:/);
  await waitForOutput(() => output, /Watching theme sources/);
  assert.equal(watcher.exitCode, null, output);

  await writeFile(entryPath, ":root { --watch-recovered: true; }\n", "utf8");

  await waitForOutput(() => output, /Change detected: src\/scss\/index\.scss/);
  await waitForOutput(() => output, /Built theme\.css/);
  assert.equal(watcher.exitCode, null, output);
  assert.doesNotMatch(output, /unhandled|ERR_UNHANDLED_REJECTION/i);
});
