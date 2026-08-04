import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { existsSync, readFileSync, realpathSync } from "node:fs";
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
const developmentConfigPath = path.join(root, "development.json");
const outputPath = path.join(root, "theme.css");
const fontAssetsPath = path.join(root, "src/assets/fonts");
const redistributableLicensePaths = [
  ["Pixel theme — MIT License", path.join(root, "LICENSE")],
  [
    "Fusion Pixel — SIL Open Font License 1.1",
    path.join(fontAssetsPath, "licenses/Fusion-Pixel-OFL-1.1.txt"),
  ],
  [
    "JetBrains Mono — SIL Open Font License 1.1",
    path.join(fontAssetsPath, "licenses/JetBrains-Mono-OFL-1.1.txt"),
  ],
];
const mebibyte = 1024 * 1024;
const maxEncodedFontBytes = Math.floor(1.2 * mebibyte);
const maxGeneratedCssBytes = Math.floor(1.5 * mebibyte);
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

function maskCssStringsAndComments(css) {
  const masked = new Array(css.length);
  let index = 0;

  while (index < css.length) {
    if (css[index] === "/" && css[index + 1] === "*") {
      masked[index++] = " ";
      masked[index++] = " ";
      while (index < css.length) {
        const closesComment = css[index] === "*" && css[index + 1] === "/";
        masked[index++] = " ";
        if (closesComment) {
          masked[index++] = " ";
          break;
        }
      }
      continue;
    }

    if (css[index] === '"' || css[index] === "'") {
      const quote = css[index];
      masked[index++] = " ";
      while (index < css.length) {
        const character = css[index];
        masked[index++] = " ";
        if (character === "\\" && index < css.length) {
          masked[index++] = " ";
        } else if (character === quote) {
          break;
        }
      }
      continue;
    }

    masked[index] = css[index];
    index += 1;
  }

  return masked.join("");
}

function readCssFunctionArgument(css, startIndex) {
  let depth = 1;
  let index = startIndex;
  let quote;

  while (index < css.length) {
    const character = css[index];
    if (quote) {
      if (character === "\\") {
        index += 2;
        continue;
      }
      if (character === quote) quote = undefined;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      index += 1;
      continue;
    }
    if (character === "/" && css[index + 1] === "*") {
      const commentEnd = css.indexOf("*/", index + 2);
      index = commentEnd < 0 ? css.length : commentEnd + 2;
      continue;
    }
    if (character === "(") depth += 1;
    if (character === ")") {
      depth -= 1;
      if (depth === 0) return css.slice(startIndex, index);
    }
    index += 1;
  }

  return css.slice(startIndex);
}

function normalizeCssUrl(argument) {
  const withoutComments = argument.replace(/\/\*[\s\S]*?\*\//g, "").trim();
  const quote = withoutComments[0];
  if (
    (quote === '"' || quote === "'") &&
    withoutComments.at(-1) === quote
  ) {
    return withoutComments.slice(1, -1).trim();
  }
  return withoutComments;
}

function* cssUrlValues(css, syntaxCss = maskCssStringsAndComments(css)) {
  const urlFunction = /\burl\s*\(/gi;
  for (const match of syntaxCss.matchAll(urlFunction)) {
    yield normalizeCssUrl(readCssFunctionArgument(css, match.index + match[0].length));
  }
}

function assertEncodedFontBudget(css) {
  let encodedFontBytes = 0;

  for (const fontFace of css.matchAll(/@font-face\s*{([\s\S]*?)}/gi)) {
    for (const value of cssUrlValues(fontFace[1])) {
      if (!/^data:/i.test(value)) continue;
      const separator = value.indexOf(",");
      if (separator >= 0) {
        encodedFontBytes += Buffer.byteLength(value.slice(separator + 1), "utf8");
      }
    }
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

function embeddedFontDataUrl(argumentsList) {
  const relativePath = argumentsList[0].assertString("relativePath").text;
  const requestedPath = path.resolve(fontAssetsPath, relativePath);
  const pathWithinFontAssets = path.relative(fontAssetsPath, requestedPath);

  if (
    pathWithinFontAssets.startsWith("..") ||
    path.isAbsolute(pathWithinFontAssets) ||
    path.extname(requestedPath).toLowerCase() !== ".woff2"
  ) {
    throw new Error(`font asset must be a WOFF2 file under src/assets/fonts: ${relativePath}`);
  }

  const realAssetPath = realpathSync(requestedPath);
  const realPathWithinFontAssets = path.relative(
    realpathSync(fontAssetsPath),
    realAssetPath,
  );
  if (
    realPathWithinFontAssets.startsWith("..") ||
    path.isAbsolute(realPathWithinFontAssets)
  ) {
    throw new Error(`font asset must not leave src/assets/fonts: ${relativePath}`);
  }

  const encodedFont = readFileSync(realAssetPath).toString("base64");
  return new sass.SassString(
    `url("data:font/woff2;base64,${encodedFont}")`,
    { quotes: false },
  );
}

function preservedLicenseComment(title, license) {
  const lines = license.trim().split(/\r?\n/);
  return [
    "/*!",
    ` * ${title}`,
    " *",
    ...lines.map((line) => (line ? ` * ${line}` : " *")),
    " */",
  ].join("\n");
}

function assertEmbeddedRuntimeAssets(css) {
  const syntaxCss = maskCssStringsAndComments(css);

  if (/@import\b/i.test(syntaxCss)) {
    throw new Error("compiled theme.css must not contain @import; embed assets instead");
  }
  if (/(?:^|[^\w-])(?:-webkit-)?image-set\s*\(/i.test(syntaxCss)) {
    throw new Error(
      "compiled theme.css must not contain image-set; use one embedded data URL",
    );
  }

  for (const value of cssUrlValues(css, syntaxCss)) {
    if (/^(?:https?:)?\/\//i.test(value)) {
      throw new Error("theme.css must not load runtime assets from the network");
    }
    if (!/^(?:data:|#)/i.test(value)) {
      throw new Error(
        `theme.css runtime assets must be embedded as data URLs; received ${value || "an empty URL"}`,
      );
    }
  }
}

async function renderTheme() {
  const manifest = await readManifest();
  await assertCompatibilityMapping(manifest);

  const [header, licenses, compiled] = await Promise.all([
    readFile(headerPath, "utf8"),
    Promise.all(
      redistributableLicensePaths.map(async ([title, licensePath]) =>
        preservedLicenseComment(title, await readFile(licensePath, "utf8")),
      ),
    ),
    Promise.resolve(
      sass.compile(entryPath, {
        functions: {
          "pixel-font-data-url($relativePath)": embeddedFontDataUrl,
        },
        loadPaths: [path.join(root, "src/scss")],
        style: "expanded",
      }),
    ),
  ]);

  const css = `${header.trim()}\n\n${licenses.join("\n\n")}\n\n${compiled.css.trim()}\n`;

  assertEmbeddedRuntimeAssets(css);
  assertEncodedFontBudget(css);
  assertGeneratedCssBudget(css);

  return css;
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
  const developmentConfig = JSON.parse(
    await readFile(developmentConfigPath, "utf8"),
  );
  const vaultId = developmentConfig.vaultId;
  if (typeof vaultId !== "string" || vaultId.trim() === "") {
    throw new Error("development.json requires a non-empty vaultId");
  }

  const registryPath = defaultVaultRegistryPath();
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  const vaultPath = registry.vaults?.[vaultId]?.path;

  if (typeof vaultPath !== "string" || vaultPath.trim() === "") {
    throw new Error(
      `Obsidian Vault registry does not contain dev-test Vault ID ${vaultId}`,
    );
  }

  return { vaultId, vaultPath: path.resolve(vaultPath) };
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

  const { vaultId, vaultPath } = await readDedicatedVaultPath();
  const expectedDestination = path.join(
    vaultPath,
    ".obsidian",
    "themes",
    "Pixel",
  );
  if (path.resolve(destination) !== expectedDestination) {
    throw new Error(
      `OBSIDIAN_THEME_DIR must target the Pixel theme in the configured dedicated Vault ${vaultId}`,
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

function reportBuildFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Build failed: ${message}`);
}

async function runWatch() {
  let timer;
  let buildQueue = Promise.resolve();
  const watcher = chokidar.watch(
    ["src/scss", "src/css", "src/assets", "manifest.json", "versions.json"],
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
