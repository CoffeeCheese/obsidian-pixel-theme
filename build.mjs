import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import chokidar from "chokidar";
import * as sass from "sass";

const root = path.dirname(fileURLToPath(import.meta.url));
const entryPath = path.join(root, "src/scss/index.scss");
const headerPath = path.join(root, "src/css/header.css");
const manifestPath = path.join(root, "manifest.json");
const versionsPath = path.join(root, "versions.json");
const outputPath = path.join(root, "theme.css");
const mebibyte = 1024 * 1024;
const maxEncodedFontBytes = Math.floor(1.2 * mebibyte);
const maxGeneratedCssBytes = Math.floor(1.5 * mebibyte);
const dedicatedVaultId = "773da17a65bacca8";
const isWatch = process.argv.includes("--watch");
const isCheck = process.argv.includes("--check");

loadLocalEnvironment();

function loadLocalEnvironment() {
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return;

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, "$2");

    if (!(key in process.env)) process.env[key] = value;
  }
}

function assertSemver(value, field) {
  if (!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(value)) {
    throw new Error(`${field} must use exact x.y.z SemVer; received ${value}`);
  }
}

async function readManifest() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  for (const field of ["name", "version", "minAppVersion", "author"]) {
    if (typeof manifest[field] !== "string" || manifest[field].trim() === "") {
      throw new Error(`manifest.json requires a non-empty ${field}`);
    }
  }

  assertSemver(manifest.version, "manifest version");
  assertSemver(manifest.minAppVersion, "minimum app version");

  if (
    process.env.GITHUB_REF_TYPE === "tag" &&
    process.env.GITHUB_REF_NAME !== manifest.version
  ) {
    throw new Error(
      `release tag ${process.env.GITHUB_REF_NAME} does not match manifest version ${manifest.version}`,
    );
  }

  return manifest;
}

async function assertCompatibilityMapping(manifest) {
  const versions = JSON.parse(await readFile(versionsPath, "utf8"));

  if (versions[manifest.version] !== manifest.minAppVersion) {
    throw new Error(
      `versions.json must map current theme version ${manifest.version} to minAppVersion ${manifest.minAppVersion}`,
    );
  }
}

function assertEncodedFontBudget(css) {
  let encodedFontBytes = 0;

  for (const match of css.matchAll(/data:font\/[^,]+,([^)'"\s]+)/gi)) {
    encodedFontBytes += Buffer.byteLength(match[1], "utf8");
  }

  if (encodedFontBytes > maxEncodedFontBytes) {
    throw new Error(
      `Encoded font payload exceeds 1.2 MiB budget (${encodedFontBytes} bytes); reduce or subset embedded fonts`,
    );
  }
}

function assertGeneratedCssBudget(css) {
  const generatedCssBytes = Buffer.byteLength(css, "utf8");

  if (generatedCssBytes > maxGeneratedCssBytes) {
    throw new Error(
      `Generated theme.css exceeds 1.5 MiB budget (${generatedCssBytes} bytes); remove or reduce generated CSS`,
    );
  }
}

async function renderTheme() {
  const manifest = await readManifest();
  await assertCompatibilityMapping(manifest);

  const [header, compiled] = await Promise.all([
    readFile(headerPath, "utf8"),
    Promise.resolve(
      sass.compile(entryPath, {
        loadPaths: [path.join(root, "src/scss")],
        style: "expanded",
      }),
    ),
  ]);

  const css = `${header.trim()}\n\n${compiled.css.trim()}\n`;
  const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");

  if (
    /(?:@import\s+(?:url\()?|url\()\s*["']?\s*https?:\/\//i.test(
      cssWithoutComments,
    )
  ) {
    throw new Error("theme.css must not load runtime assets from the network");
  }

  assertEncodedFontBudget(css);
  assertGeneratedCssBudget(css);

  return { css, manifest };
}

function defaultVaultRegistryPath() {
  if (process.platform === "darwin") {
    return path.join(
      homedir(),
      "Library",
      "Application Support",
      "obsidian",
      "obsidian.json",
    );
  }

  if (process.platform === "win32") {
    if (!process.env.APPDATA) {
      throw new Error("APPDATA is required to locate the Obsidian Vault registry");
    }
    return path.join(process.env.APPDATA, "obsidian", "obsidian.json");
  }

  return path.join(
    process.env.XDG_CONFIG_HOME || path.join(homedir(), ".config"),
    "obsidian",
    "obsidian.json",
  );
}

async function readDedicatedVaultPath() {
  const vaultId = process.env.OBSIDIAN_VAULT_ID;
  if (vaultId !== dedicatedVaultId) {
    throw new Error(
      `OBSIDIAN_VAULT_ID must be the dedicated dev-test Vault ID ${dedicatedVaultId}`,
    );
  }

  const registryPath =
    process.env.OBSIDIAN_VAULT_REGISTRY || defaultVaultRegistryPath();
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  const vaultPath = registry.vaults?.[vaultId]?.path;

  if (typeof vaultPath !== "string" || vaultPath.trim() === "") {
    throw new Error(
      `Obsidian Vault registry does not contain dev-test Vault ID ${dedicatedVaultId}`,
    );
  }

  return path.resolve(vaultPath);
}

async function assertNoSymlinkedThemePath(vaultPath) {
  if ((await realpath(vaultPath)) !== vaultPath) {
    throw new Error("theme destination must not traverse symbolic links");
  }

  let currentPath = vaultPath;
  for (const segment of [".obsidian", "themes", "Pixel"]) {
    currentPath = path.join(currentPath, segment);
    try {
      if ((await lstat(currentPath)).isSymbolicLink()) {
        throw new Error("theme destination must not traverse symbolic links");
      }
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
  }
}

async function deployToVault() {
  const destination = process.env.OBSIDIAN_THEME_DIR;
  if (!destination) return;
  if (!path.isAbsolute(destination)) {
    throw new Error("OBSIDIAN_THEME_DIR must be an absolute path");
  }

  const vaultPath = await readDedicatedVaultPath();
  const expectedDestination = path.join(
    vaultPath,
    ".obsidian",
    "themes",
    "Pixel",
  );
  if (path.resolve(destination) !== expectedDestination) {
    throw new Error(
      `OBSIDIAN_THEME_DIR must target the Pixel theme in Vault ${dedicatedVaultId}`,
    );
  }

  await assertNoSymlinkedThemePath(vaultPath);
  await mkdir(destination, { recursive: true });
  if ((await realpath(destination)) !== expectedDestination) {
    throw new Error("theme destination must not traverse symbolic links");
  }
  await Promise.all([
    installPackageFile(outputPath, path.join(destination, "theme.css")),
    installPackageFile(manifestPath, path.join(destination, "manifest.json")),
  ]);
  console.log(`Deployed theme package to ${destination}`);
}

async function installPackageFile(source, destination) {
  const temporaryPath = path.join(
    path.dirname(destination),
    `.${path.basename(destination)}.${process.pid}.${randomUUID()}.tmp`,
  );

  try {
    await writeFile(temporaryPath, await readFile(source), { flag: "wx" });
    await rename(temporaryPath, destination);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

async function build() {
  const { css } = await renderTheme();

  if (isCheck) {
    if (!existsSync(outputPath)) {
      throw new Error("theme.css is missing; run npm run build");
    }

    const committed = await readFile(outputPath, "utf8");
    if (committed !== css) {
      throw new Error("theme.css is stale; run npm run build and commit the result");
    }

    console.log("Theme source, manifest, and generated artifact are consistent.");
    return;
  }

  await writeFile(outputPath, css, "utf8");
  console.log(`Built ${path.relative(root, outputPath)}`);
  await deployToVault();
}

function reportBuildFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Build failed: ${message}`);
}

async function runWatch() {
  let timer;
  let buildQueue = Promise.resolve();
  const watcher = chokidar.watch(
    ["src/scss", "src/css", "manifest.json", "versions.json"],
    {
      cwd: root,
      ignoreInitial: true,
    },
  );

  const runRecoverableBuild = async (changedPath) => {
    if (changedPath) console.log(`Change detected: ${changedPath}`);
    try {
      await build();
    } catch (error) {
      reportBuildFailure(error);
    }
  };

  watcher.on("all", (_event, changedPath) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      buildQueue = buildQueue.then(() => runRecoverableBuild(changedPath));
    }, 80);
  });

  await new Promise((resolve) => watcher.on("ready", resolve));
  await runRecoverableBuild();
  console.log("Watching theme sources…");
}

if (isWatch) {
  await runWatch();
} else {
  await build();
}
