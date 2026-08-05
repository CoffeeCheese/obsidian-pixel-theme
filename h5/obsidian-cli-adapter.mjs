import { execFile } from "node:child_process";
import { readFile, realpath } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";

import {
  readFixtureContentCatalog,
  verifyFixtureContent,
} from "./fixture-content.mjs";
import {
  assertTransitionObservation,
  buildFixtureLayout,
  buildTransitionPlans,
  fixtureObservationCode,
  transitionObservationCode,
} from "./fixture-runtime.mjs";
import {
  assertSafeThemeDirectory,
  installPackageFiles,
  packageHashes,
  readPackageFiles,
} from "./package-install.mjs";
import { H5_RUN_CAPABILITIES } from "./visual-runner.mjs";

const execFileAsync = promisify(execFile);

export function parseObsidianJsonOutput(output, label) {
  const trimmed = output.trim();
  for (const candidate of [
    trimmed,
    ...trimmed.split(/\r?\n/).reverse(),
  ]) {
    try {
      const parsed = JSON.parse(candidate.replace(/^=>\s*/, ""));
      if (typeof parsed === "string") {
        try {
          return JSON.parse(parsed);
        } catch {
          // The outer parse was the useful value.
        }
      }
      return parsed;
    } catch {
      // Try the next CLI output line.
    }
  }
  throw new Error(`Obsidian CLI returned invalid JSON for ${label}`);
}

function terminalValue(output) {
  const line = output
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .at(-1);
  return line?.replace(/^[^:]+:\s*/, "").trim() || "";
}

function assertEmptyCapturedBuffer(output, label) {
  const normalized = output.trim();
  if (!/^No (?:errors|console messages) captured\.$/i.test(normalized)) {
    throw new Error(`${label} vetoed H5 approval: ${normalized || "unknown output"}`);
  }
}

function workspaceChangeCode(layout, colorTheme) {
  const serializedLayout = JSON.stringify(layout);
  const serializedTheme = JSON.stringify(colorTheme);
  return `(async()=>{app.vault.setConfig("theme",${serializedTheme});app.setTheme(${serializedTheme});await app.workspace.changeLayout(${serializedLayout});await new Promise(resolve=>setTimeout(resolve,120));return "ok"})()`;
}

function themeReloadCode(expectedThemeCssSha256) {
  return `(async()=>{await app.customCss.reloadTheme();const expected=${JSON.stringify(expectedThemeCssSha256)};const sha256=async text=>{const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));return [...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,"0")).join("")};const deadline=Date.now()+3000;while(Date.now()<deadline){if(await sha256(app.customCss.styleEl.textContent)===expected)return "ok";await new Promise(resolve=>setTimeout(resolve,50))}throw new Error("Pixel theme reload did not reach the installed artifact")})()`;
}

export function nativeColorTheme(fixtureTheme) {
  return fixtureTheme === "light" ? "moonstone" : "obsidian";
}

export async function createObsidianCliAdapter({
  root,
  env = process.env,
  executeCommand,
} = {}) {
  if (!root) throw new TypeError("Obsidian CLI adapter requires the repository root");
  const cli = env.OBSIDIAN_H5_CLI || "obsidian";
  const profileCandidate = path.resolve(
    root,
    env.OBSIDIAN_H5_PROFILE_DIR ||
      ".scratch/pixel-desktop-h5-fidelity/runtime-profile",
  );
  const developmentConfig = JSON.parse(
    await readFile(path.join(root, "development.json"), "utf8"),
  );
  const vaultId = developmentConfig.vaultId;
  const contentCatalog = await readFixtureContentCatalog(
    new URL("./fixture-content.v1.json", import.meta.url),
  );
  const execute =
    executeCommand ||
    (async (argumentsList, { signal } = {}) => {
      const result = await execFileAsync(cli, argumentsList, {
        cwd: root,
        maxBuffer: 8 * 1024 * 1024,
        signal,
      });
      return result.stdout;
    });

  let vaultPath;
  let profilePath;
  let themeDirectory;

  const command = (argumentsList, options) =>
    execute([`vault=${vaultId}`, ...argumentsList], options);
  const evaluate = async (code, options, label = "eval") =>
    parseObsidianJsonOutput(
      await command(["eval", `code=${code}`], options),
      label,
    );
  const changeLayout = (layout, colorTheme, options) =>
    command(["eval", `code=${workspaceChangeCode(layout, colorTheme)}`], options);

  return {
    async preflight({ catalog, fixtures, packageIdentity, signal }) {
      profilePath = await realpath(profileCandidate);
      const profileRegistry = JSON.parse(
        await readFile(path.join(profilePath, "obsidian.json"), "utf8"),
      );
      const registeredVaultIds = Object.keys(profileRegistry.vaults || {});
      const registeredVault = profileRegistry.vaults?.[vaultId];
      if (
        registeredVaultIds.length !== 1 ||
        !registeredVault ||
        registeredVault.open !== true
      ) {
        throw new Error(
          `H5 profile must contain only the open dedicated Vault ${vaultId}`,
        );
      }
      vaultPath = await realpath(registeredVault.path);

      const windowState = JSON.parse(
        await readFile(path.join(profilePath, `${vaultId}.json`), "utf8"),
      );
      if (windowState.zoom !== 0) {
        throw new Error("H5 profile must use the default zoom level 0");
      }
      if (contentCatalog.fixtureVersion !== catalog.fixtureVersion) {
        throw new Error("fixture content version must match the fixture catalog");
      }

      for (const helpCommand of [
        "version",
        "theme",
        "vault",
        "eval",
        "dev:cdp",
        "dev:screenshot",
        "dev:errors",
        "dev:console",
      ]) {
        await execute(["help", helpCommand], { signal });
      }
      const [versionOutput, themeOutput, vaultOutput] = await Promise.all([
        command(["version"], { signal }),
        command(["theme"], { signal }),
        command(["vault", "info=path"], { signal }),
      ]);
      const obsidianVersion = versionOutput.match(/\d+\.\d+\.\d+/)?.[0];
      if (!obsidianVersion) throw new Error("unable to read exact Obsidian version");
      const activeTheme = terminalValue(themeOutput);
      const cliVaultPath = await realpath(terminalValue(vaultOutput));
      if (cliVaultPath !== vaultPath) {
        throw new Error("Obsidian CLI is not attached to the dedicated fixture Vault");
      }

      await command(["dev:debug", "on"], { signal });
      await Promise.all([
        command(["dev:errors", "clear"], { signal }),
        command(["dev:console", "clear"], { signal }),
      ]);
      const runtime = await evaluate(
        `JSON.stringify({desktop:!document.body.classList.contains("is-mobile"),zoomFactor:(()=>{try{return require("electron").webFrame.getZoomFactor()}catch{return null}})(),vaultPath:app.vault.adapter.getBasePath()})`,
        { signal },
        "runtime preflight",
      );
      if ((await realpath(runtime.vaultPath)) !== vaultPath) {
        throw new Error("Obsidian runtime Vault does not match the dedicated fixture Vault");
      }

      const requiredContentIds = [
        ...new Set(fixtures.flatMap((fixture) => fixture.requiredContentIds)),
      ];
      const availableContentIds = await verifyFixtureContent({
        vaultPath,
        contentCatalog,
        requiredContentIds,
      });
      themeDirectory = path.join(vaultPath, ".obsidian", "themes", "Pixel");
      await assertSafeThemeDirectory(vaultPath, themeDirectory);
      const candidatePackage = packageHashes(await readPackageFiles(root));

      return {
        vault: { id: vaultId, path: vaultPath, dedicated: true },
        profile: { path: profilePath, dedicated: true },
        obsidianVersion,
        activeTheme,
        platform: runtime.desktop ? "desktop" : "mobile",
        zoomFactor: runtime.zoomFactor,
        package: candidatePackage,
        availableContentIds,
        capabilities: [...H5_RUN_CAPABILITIES],
        packageIdentity,
      };
    },

    async snapshotWorkspace({ signal } = {}) {
      const runtimeSnapshot = await evaluate(
        `JSON.stringify({layout:app.workspace.getLayout(),colorTheme:app.vault.getConfig("theme")})`,
        { signal },
        "workspace snapshot",
      );
      return {
        ...runtimeSnapshot,
        packageFiles: {
          ...(await readPackageFiles(themeDirectory)),
        },
      };
    },

    async installPackage() {
      const packageFiles = await readPackageFiles(root);
      const hashes = packageHashes(packageFiles);
      await installPackageFiles(themeDirectory, packageFiles);
      await command(["eval", `code=${themeReloadCode(hashes.themeCssSha256)}`]);
      return packageHashes(await readPackageFiles(themeDirectory));
    },

    async establishFixture({ fixture, signal }) {
      await command(
        [
          "dev:cdp",
          "method=Emulation.setDeviceMetricsOverride",
          `params=${JSON.stringify({
            width: fixture.viewport.width,
            height: fixture.viewport.height,
            deviceScaleFactor: 1,
            mobile: false,
          })}`,
        ],
        { signal },
      );
      await changeLayout(
        buildFixtureLayout(fixture),
        nativeColorTheme(fixture.theme),
        { signal },
      );
    },

    async verifyFixture({ fixture, signal }) {
      const observation = await evaluate(
        fixtureObservationCode(fixture),
        { signal },
        `fixture observation ${fixture.id}`,
      );
      return observation;
    },

    async exerciseTransitions({ fixture, transitions, signal }) {
      const colorTheme = nativeColorTheme(fixture.theme);
      const plans = buildTransitionPlans(fixture);
      if (
        plans.length !== transitions.length ||
        plans.some((plan, index) => plan.transition !== transitions[index])
      ) {
        throw new Error("adapter transition layouts do not match the fixture catalog");
      }
      const results = [];
      for (const plan of plans) {
        await changeLayout(plan.layout, colorTheme, { signal });
        const observation = await evaluate(
          transitionObservationCode(),
          { signal },
          `${plan.transition} transition observation`,
        );
        assertTransitionObservation(plan, observation);
        results.push({ transition: plan.transition, verified: true });
      }
      await changeLayout(buildFixtureLayout(fixture), colorTheme, { signal });
      return results;
    },

    async captureEvidence({ outputPath, signal }) {
      await command(["dev:screenshot", `path=${outputPath}`], { signal });
      return outputPath;
    },

    async verifyObjectiveVetoes({ signal }) {
      const [errors, consoleErrors] = await Promise.all([
        command(["dev:errors"], { signal }),
        command(["dev:console", "level=error", "limit=50"], { signal }),
      ]);
      assertEmptyCapturedBuffer(errors, "Obsidian captured errors");
      assertEmptyCapturedBuffer(consoleErrors, "Obsidian error-level console buffer");
      return [{ check: "error-buffers", result: "Pass" }];
    },

    async restoreWorkspace(snapshot) {
      const restorationErrors = [];
      try {
        await changeLayout(snapshot.layout, snapshot.colorTheme, {});
      } catch (error) {
        restorationErrors.push(error);
      }
      try {
        await installPackageFiles(themeDirectory, snapshot.packageFiles);
        const restoredHashes = packageHashes(snapshot.packageFiles);
        await command([
          "eval",
          `code=${themeReloadCode(restoredHashes.themeCssSha256)}`,
        ]);
      } catch (error) {
        restorationErrors.push(error);
      }
      try {
        await command([
          "dev:cdp",
          "method=Emulation.clearDeviceMetricsOverride",
        ]);
      } catch (error) {
        restorationErrors.push(error);
      }
      if (restorationErrors.length > 0) {
        throw new AggregateError(
          restorationErrors,
          `unable to restore H5 workspace: ${restorationErrors.map((error) => error.message).join("; ")}`,
        );
      }
    },
  };
}
