import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const packageFileNames = new Map([
  ["themeCss", "theme.css"],
  ["manifest", "manifest.json"],
]);

export async function assertSafeThemeDirectory(vaultPath, themeDirectory) {
  const relativeThemePath = path.relative(
    path.resolve(vaultPath),
    path.resolve(themeDirectory),
  );
  if (relativeThemePath !== path.join(".obsidian", "themes", "Pixel")) {
    throw new Error("H5 package destination must target Pixel in the dedicated Vault");
  }
  const realVaultPath = await realpath(vaultPath);
  const expectedDirectory = path.join(
    realVaultPath,
    ".obsidian",
    "themes",
    "Pixel",
  );
  let current = realVaultPath;
  for (const segment of [".obsidian", "themes", "Pixel"]) {
    current = path.join(current, segment);
    if ((await lstat(current)).isSymbolicLink()) {
      throw new Error("H5 package destination must not traverse symbolic links");
    }
  }
  if ((await realpath(themeDirectory)) !== expectedDirectory) {
    throw new Error("H5 package destination must stay inside the dedicated Vault");
  }
}

export async function readPackageFiles(directory) {
  return Object.fromEntries(
    await Promise.all(
      [...packageFileNames].map(async ([key, fileName]) => [
        key,
        await readFile(path.join(directory, fileName)),
      ]),
    ),
  );
}

export function packageHashes(packageFiles) {
  return {
    themeCssSha256: createHash("sha256")
      .update(packageFiles.themeCss)
      .digest("hex"),
    manifestSha256: createHash("sha256")
      .update(packageFiles.manifest)
      .digest("hex"),
  };
}

async function atomicReplace(destination, bytes) {
  const temporaryPath = path.join(
    path.dirname(destination),
    `.${path.basename(destination)}.${process.pid}.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporaryPath, bytes, { flag: "wx" });
    await rename(temporaryPath, destination);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export async function installPackageFiles(themeDirectory, packageFiles) {
  const destinations = [...packageFileNames].map(([key, fileName]) => [
    key,
    path.join(themeDirectory, fileName),
  ]);
  const previous = new Map(
    await Promise.all(
      destinations.map(async ([, destination]) => [
        destination,
        await readFile(destination),
      ]),
    ),
  );
  const replaced = [];
  try {
    for (const [key, destination] of destinations) {
      await atomicReplace(destination, packageFiles[key]);
      replaced.push(destination);
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const destination of replaced.reverse()) {
      try {
        await atomicReplace(destination, previous.get(destination));
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        `H5 package install and rollback failed: ${error.message}`,
        { cause: error },
      );
    }
    throw error;
  }
}
