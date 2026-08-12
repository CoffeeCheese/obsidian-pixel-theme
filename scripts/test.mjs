#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const testDirectory = path.join(root, "test");
const testFiles = (await readdir(testDirectory))
  .filter((name) => name.endsWith(".test.mjs") && !name.startsWith("h5-"))
  .sort()
  .map((name) => path.join("test", name));

if (testFiles.length === 0) {
  throw new Error("No tracked Pixel package tests were found");
}

const result = spawnSync(
  process.execPath,
  ["--test", "--test-concurrency=1", ...testFiles],
  {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
