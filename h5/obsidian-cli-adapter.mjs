import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  readFile,
  realpath,
} from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";

import {
  readFixtureContentCatalog,
  verifyFixtureContent,
} from "./fixture-content.mjs";
import { H5_RUN_CAPABILITIES } from "./visual-runner.mjs";

const execFileAsync = promisify(execFile);
const readerPath = "H5 Reference Workspace/30 资源/常青笔记的维护节奏.md";
const canvasPath = "Pixel Canvas Dense QA.canvas";

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

function parseJsonOutput(output, label) {
  const trimmed = output.trim();
  for (const candidate of [
    trimmed,
    ...trimmed.split(/\r?\n/).reverse(),
  ]) {
    try {
      const parsed = JSON.parse(candidate);
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

function leafState(viewType, id) {
  if (viewType === "markdown") {
    return {
      id,
      type: "leaf",
      state: {
        type: "markdown",
        state: { file: readerPath, mode: "preview", source: false },
      },
    };
  }
  if (viewType === "canvas") {
    return {
      id,
      type: "leaf",
      state: { type: "canvas", state: { file: canvasPath } },
    };
  }
  return { id, type: "leaf", state: { type: viewType, state: {} } };
}

function buildFixtureLayout(fixture) {
  const stem = fixture.id.replace(/[^a-z0-9]/g, "-");
  const rootGroups = fixture.topology.rootGroups.map((group, groupIndex) => ({
    id: `${stem}-root-${groupIndex}`,
    type: "tabs",
    currentTab: 0,
    children: group.tabs.map((viewType, tabIndex) =>
      leafState(viewType, `${stem}-root-${groupIndex}-tab-${tabIndex}`),
    ),
  }));
  const active = rootGroups[0].children[0].id;

  return {
    main: {
      id: `${stem}-main`,
      type: "split",
      direction: "vertical",
      children: rootGroups,
    },
    left: {
      id: `${stem}-left`,
      type: "split",
      direction: "horizontal",
      width: 260,
      children: [
        {
          id: `${stem}-files-tabs`,
          type: "tabs",
          currentTab: 0,
          children: [leafState("file-explorer", `${stem}-files`)],
        },
      ],
    },
    right: {
      id: `${stem}-right`,
      type: "split",
      direction: "horizontal",
      width: 248,
      children: [
        {
          id: `${stem}-properties-tabs`,
          type: "tabs",
          currentTab: 0,
          children: [
            {
              id: `${stem}-properties`,
              type: "leaf",
              state: {
                type: "file-properties",
                state: { file: readerPath },
              },
            },
          ],
        },
        {
          id: `${stem}-outline-tabs`,
          type: "tabs",
          currentTab: 0,
          children: [
            {
              id: `${stem}-outline`,
              type: "leaf",
              state: { type: "outline", state: { file: readerPath } },
            },
          ],
        },
      ],
    },
    "left-ribbon": { hiddenItems: {} },
    active,
    lastOpenFiles: [readerPath, canvasPath],
  };
}

function clone(value) {
  return structuredClone(value);
}

function transitionLayouts(fixture) {
  const baseline = buildFixtureLayout(fixture);
  const created = clone(baseline);
  const createdGroup = created.main.children[0];
  const temporaryLeaf = leafState("empty", `${fixture.id}-transition-empty`);
  createdGroup.children.push(temporaryLeaf);

  const switched = clone(created);
  switched.main.children[0].currentTab =
    switched.main.children[0].children.length - 1;
  switched.active = temporaryLeaf.id;

  const reordered = clone(created);
  reordered.main.children[0].children.reverse();
  reordered.main.children[0].currentTab = 0;
  reordered.active = reordered.main.children[0].children[0].id;

  const split = clone(baseline);
  split.main.children.push({
    id: `${fixture.id}-transition-split`,
    type: "tabs",
    currentTab: 0,
    children: [leafState("graph", `${fixture.id}-transition-graph`)],
  });

  return [created, switched, baseline, reordered, split, baseline];
}

function workspaceChangeCode(layout, colorTheme) {
  const serializedLayout = JSON.stringify(layout);
  const serializedTheme = JSON.stringify(colorTheme);
  return `(async()=>{app.vault.setConfig("theme",${serializedTheme});app.setTheme(${serializedTheme});await app.workspace.changeLayout(${serializedLayout});await new Promise(resolve=>setTimeout(resolve,120));return "ok"})()`;
}

function observationCode(fixture) {
  const fixtureId = JSON.stringify(fixture.id);
  const isNarrow = fixture.viewport.width <= 1100;
  return `(()=>{
    const layout=app.workspace.getLayout();
    const normalizeType=(type)=>type==="file-properties"?"properties":type;
    const groups=(layout.main?.children||[]).map(group=>{
      const tabs=(group.children||[]).map(child=>normalizeType(child.state?.type));
      const active=group.children?.[group.currentTab||0]||group.children?.[0];
      const activeType=normalizeType(active?.state?.type);
      return {
        activeViewType:activeType,
        activeViewState:activeType==="markdown"&&active?.state?.state?.mode==="preview"?"reading":activeType==="empty"?"new-tab":"default",
        activeContentTier:activeType==="markdown"?"reader":activeType==="empty"?"neutral":"specialized",
        tabs
      };
    });
    const rootTypes=groups.flatMap(group=>group.tabs);
    const rightBanks=(layout.right?.children||[]).map(group=>normalizeType(group.children?.[group.currentTab||0]?.state?.type));
    const visible=element=>{const style=getComputedStyle(element);const rect=element.getBoundingClientRect();return style.display!=="none"&&style.visibility!=="hidden"&&style.pointerEvents!=="none"&&rect.width>0&&rect.height>0};
    const requiredControlSelectors=[".mod-root .workspace-tab-header-new-tab",".mod-root .workspace-tab-header-tab-list",".mod-root .view-actions",".sidebar-toggle-button"];
    const nativeActionsVisible=requiredControlSelectors.every(selector=>[...document.querySelectorAll(selector)].some(visible));
    const rail=document.querySelector(".mod-root .workspace-tab-header-container-inner");
    const contentIds=[];
    if(rootTypes.includes("markdown"))contentIds.push("h5-reader-bilingual");
    if(rootTypes.includes("graph"))contentIds.push("h5-graph");
    if(rootTypes.includes("canvas"))contentIds.push("h5-canvas");
    if(document.querySelector(".mod-left-split .workspace-leaf-content[data-type='file-explorer']"))contentIds.push("h5-file-tree");
    if(${isNarrow})contentIds.unshift("h5-long-bilingual-labels");
    const nativeViewTypes=["file-explorer",...new Set(rootTypes),...rightBanks];
    return JSON.stringify({
      fixtureId:${fixtureId},
      viewport:{width:window.innerWidth,height:window.innerHeight},
      theme:document.body.classList.contains("theme-dark")?"dark":"light",
      nativeViewTypes,
      topology:{
        workspaceModel:document.body.classList.contains("is-mobile")?"mobile":"d1-desktop",
        rootArrangement:groups.length===2?"side-by-side":"single",
        tabRail:rail&&rail.scrollWidth>rail.clientWidth?"overflow-stress":"native",
        edgeFoldExpected:window.innerWidth<=1100,
        leftDockVisible:!(layout.left?.collapsed)&&!!document.querySelector(".mod-left-split:not(.is-sidedock-collapsed)"),
        rightBanks,
        rootGroups:groups,
        nativeActionsVisible
      },
      requiredContentIds:contentIds
    });
  })()`;
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

  const command = (argumentsList, options) =>
    execute([`vault=${vaultId}`, ...argumentsList], options);
  const evaluate = async (code, options, label = "eval") =>
    parseJsonOutput(await command(["eval", `code=${code}`], options), label);
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
      const themeDirectory = path.join(vaultPath, ".obsidian", "themes", "Pixel");
      const installedPackage = {
        themeCssSha256: await sha256(path.join(themeDirectory, "theme.css")),
        manifestSha256: await sha256(path.join(themeDirectory, "manifest.json")),
      };

      return {
        vault: { id: vaultId, path: vaultPath, dedicated: true },
        profile: { path: profilePath, dedicated: true },
        obsidianVersion,
        activeTheme,
        platform: runtime.desktop ? "desktop" : "mobile",
        zoomFactor: runtime.zoomFactor,
        installedPackage,
        availableContentIds,
        capabilities: [...H5_RUN_CAPABILITIES],
        packageIdentity,
      };
    },

    async snapshotWorkspace({ signal } = {}) {
      return evaluate(
        `JSON.stringify({layout:app.workspace.getLayout(),colorTheme:app.vault.getConfig("theme")})`,
        { signal },
        "workspace snapshot",
      );
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
        fixture.theme === "light" ? "obsidian" : "moonstone",
        { signal },
      );
    },

    async verifyFixture({ fixture, signal }) {
      return evaluate(
        observationCode(fixture),
        { signal },
        `fixture observation ${fixture.id}`,
      );
    },

    async exerciseTransitions({ fixture, transitions, signal }) {
      const colorTheme = fixture.theme === "light" ? "obsidian" : "moonstone";
      const layouts = transitionLayouts(fixture);
      if (layouts.length !== transitions.length) {
        throw new Error("adapter transition layouts do not match the fixture catalog");
      }
      for (const layout of layouts) {
        await changeLayout(layout, colorTheme, { signal });
      }
      await changeLayout(buildFixtureLayout(fixture), colorTheme, { signal });
      return [...transitions];
    },

    async captureEvidence({ outputPath, signal }) {
      await command(["dev:screenshot", `path=${outputPath}`], { signal });
      return outputPath;
    },

    async restoreWorkspace(snapshot) {
      try {
        await changeLayout(snapshot.layout, snapshot.colorTheme, {});
      } finally {
        await command([
          "dev:cdp",
          "method=Emulation.clearDeviceMetricsOverride",
        ]);
      }
    },
  };
}
