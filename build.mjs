import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import chokidar from "chokidar";
import * as sass from "sass";

const root = path.dirname(fileURLToPath(import.meta.url));
const entryPath = path.join(root, "src/scss/index.scss");
const headerPath = path.join(root, "src/css/header.css");
const manifestPath = path.join(root, "manifest.json");
const outputPath = path.join(root, "theme.css");
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
  if (!/^\d+\.\d+\.\d+$/.test(value)) {
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

async function renderTheme() {
  await readManifest();

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

  if (/(?:@import\s+(?:url\()?|url\()\s*["']?https?:\/\//i.test(css)) {
    throw new Error("theme.css must not load runtime assets from the network");
  }

  return css;
}

async function deployToVault() {
  const destination = process.env.OBSIDIAN_THEME_DIR;
  if (!destination) return;
  if (!path.isAbsolute(destination)) {
    throw new Error("OBSIDIAN_THEME_DIR must be an absolute path");
  }

  await mkdir(destination, { recursive: true });
  await Promise.all([
    copyFile(outputPath, path.join(destination, "theme.css")),
    copyFile(manifestPath, path.join(destination, "manifest.json")),
  ]);
  console.log(`Deployed theme package to ${destination}`);
}

async function build() {
  const css = await renderTheme();

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

if (isWatch) {
  await build();
  let timer;
  chokidar
    .watch(["src/**/*.scss", "src/**/*.css", "manifest.json"], {
      cwd: root,
      ignoreInitial: true,
    })
    .on("all", (_event, changedPath) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          console.log(`Change detected: ${changedPath}`);
          await build();
        } catch (error) {
          console.error(error instanceof Error ? error.message : error);
        }
      }, 80);
    });

  console.log("Watching theme sources…");
} else {
  await build();
}
