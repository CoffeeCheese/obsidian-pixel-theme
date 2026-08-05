#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { readFixtureCatalog } from "./fixture-catalog.mjs";
import { readPackageIdentity, runVisualH5 } from "./visual-runner.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function optionValue(argument, name) {
  const value = argument.slice(name.length + 1);
  if (value === "") throw new Error(`${name} requires a value`);
  return value;
}

export function parseVisualH5Arguments(argumentsList) {
  const options = {
    caseFilter: undefined,
    themeFilter: undefined,
    keepTemp: false,
    adapterPath: undefined,
    help: false,
  };

  for (const argument of argumentsList) {
    if (argument === "--keep-temp") {
      options.keepTemp = true;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument.startsWith("--case=")) {
      options.caseFilter = optionValue(argument, "--case");
    } else if (argument.startsWith("--theme=")) {
      options.themeFilter = optionValue(argument, "--theme");
    } else if (argument.startsWith("--adapter=")) {
      options.adapterPath = optionValue(argument, "--adapter");
    } else {
      throw new Error(`unknown option ${argument}`);
    }
  }

  if (
    options.themeFilter !== undefined &&
    !["light", "dark"].includes(options.themeFilter)
  ) {
    throw new Error("--theme must be light or dark");
  }
  return options;
}

export const visualH5Help = `Usage: npm run visual:h5 -- [options]

Options:
  --case=<case-or-fixture-id>  Run one catalog case or exact fixture
  --theme=<light|dark>         Run only one theme companion
  --keep-temp                 Retain the owned OS-temporary run directory
  --adapter=<module>          Inject an adapter module instead of the built-in CLI adapter
  --help                      Show this help
`;

async function loadAdapter(adapterPath) {
  const requestedPath =
    adapterPath || process.env.PIXEL_H5_ADAPTER || "./obsidian-cli-adapter.mjs";
  const adapterUrl = requestedPath.startsWith(".")
    ? new URL(requestedPath, import.meta.url)
    : pathToFileURL(path.resolve(requestedPath));
  const module = await import(adapterUrl.href);
  const factory = module.createAdapter || module.createObsidianCliAdapter;
  if (typeof factory !== "function") {
    throw new TypeError(
      `H5 adapter ${requestedPath} must export createAdapter or createObsidianCliAdapter`,
    );
  }
  return factory({ root, env: process.env });
}

export async function main(argumentsList = process.argv.slice(2)) {
  const options = parseVisualH5Arguments(argumentsList);
  if (options.help) {
    process.stdout.write(visualH5Help);
    return;
  }

  const [catalog, packageIdentity, adapter] = await Promise.all([
    readFixtureCatalog(new URL("./fixtures.v1.json", import.meta.url)),
    readPackageIdentity({
      themePath: path.join(root, "theme.css"),
      manifestPath: path.join(root, "manifest.json"),
    }),
    loadAdapter(options.adapterPath),
  ]);

  const controller = new AbortController();
  const interrupt = (signalName) => {
    if (!controller.signal.aborted) {
      controller.abort(new Error(`H5 visual run interrupted by ${signalName}`));
    }
  };
  const signalHandlers = new Map([
    ["SIGINT", () => interrupt("SIGINT")],
    ["SIGTERM", () => interrupt("SIGTERM")],
  ]);
  for (const [signalName, handler] of signalHandlers) {
    process.once(signalName, handler);
  }

  try {
    const result = await runVisualH5({
      adapter,
      catalog,
      packageIdentity,
      caseFilter: options.caseFilter,
      themeFilter: options.themeFilter,
      keepTemp: options.keepTemp,
      signal: controller.signal,
      onEvent(event) {
        if (event.type === "run-directory") {
          process.stdout.write(`Temporary H5 run: ${event.path}\n`);
        }
        if (event.type === "fixture-captured") {
          process.stdout.write(`Captured ${event.fixtureId}\n`);
        }
      },
    });
    process.stdout.write(
      `H5 visual run completed for ${result.fixtureIds.length} fixture(s).\n`,
    );
    if (result.runDirectory) {
      process.stdout.write(
        `Temporary evidence retained for local diagnosis: ${result.runDirectory}\n`,
      );
    }
  } finally {
    for (const [signalName, handler] of signalHandlers) {
      process.removeListener(signalName, handler);
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
