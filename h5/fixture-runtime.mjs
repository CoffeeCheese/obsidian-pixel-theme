import { isDeepStrictEqual } from "node:util";

export const canonicalReaderPath =
  "H5 Reference Workspace/30 资源/常青笔记的维护节奏.md";
export const longBilingualReaderPath =
  "Pixel Bases QA/记录 64 — 中英混合长标题 Knowledge Item 64.md";
export const canvasFixturePath = "Pixel Canvas Dense QA.canvas";

const leafBuilders = new Map([
  [
    "markdown",
    (id, fixture) => ({
      id,
      type: "leaf",
      state: {
        type: "markdown",
        state: {
          file: fixtureReaderPath(fixture),
          mode: "preview",
          source: false,
        },
      },
    }),
  ],
  [
    "canvas",
    (id) => ({
      id,
      type: "leaf",
      state: { type: "canvas", state: { file: canvasFixturePath } },
    }),
  ],
]);

export function fixtureReaderPath(fixture) {
  return fixture.caseId === "narrow-mixed-stress"
    ? longBilingualReaderPath
    : canonicalReaderPath;
}

function leafState(viewType, id, fixture) {
  const builder = leafBuilders.get(viewType);
  return builder
    ? builder(id, fixture)
    : { id, type: "leaf", state: { type: viewType, state: {} } };
}

export function buildFixtureLayout(fixture) {
  const stem = fixture.id.replace(/[^a-z0-9]/g, "-");
  const rootGroups = fixture.topology.rootGroups.map((group, groupIndex) => ({
    id: `${stem}-root-${groupIndex}`,
    type: "tabs",
    currentTab: 0,
    children: group.tabs.map((viewType, tabIndex) =>
      leafState(
        viewType,
        `${stem}-root-${groupIndex}-tab-${tabIndex}`,
        fixture,
      ),
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
          children: [leafState("file-explorer", `${stem}-files`, fixture)],
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
                state: { file: fixtureReaderPath(fixture) },
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
              state: {
                type: "outline",
                state: { file: fixtureReaderPath(fixture) },
              },
            },
          ],
        },
      ],
    },
    "left-ribbon": { hiddenItems: {} },
    active,
    lastOpenFiles: [fixtureReaderPath(fixture), canvasFixturePath],
  };
}

export function classifyRootArrangement(main) {
  const groupCount = main?.children?.length || 0;
  if (groupCount === 1) return "single";
  if (groupCount === 2 && main.direction === "vertical") return "side-by-side";
  if (groupCount === 2) return "stacked";
  return "invalid";
}

function clone(value) {
  return structuredClone(value);
}

export function buildTransitionPlans(fixture) {
  const baseline = buildFixtureLayout(fixture);
  const created = clone(baseline);
  const temporaryLeaf = leafState(
    "empty",
    `${fixture.id}-transition-empty`,
    fixture,
  );
  created.main.children[0].children.push(temporaryLeaf);

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
    children: [
      leafState("graph", `${fixture.id}-transition-graph`, fixture),
    ],
  });

  return [
    { transition: "create", layout: created },
    { transition: "switch", layout: switched },
    { transition: "close", layout: baseline },
    { transition: "reorder", layout: reordered },
    { transition: "split", layout: split },
    { transition: "merge", layout: baseline },
  ];
}

function typeAndFile(leaf) {
  return {
    id: leaf.id,
    type: leaf.state?.type,
    file: leaf.state?.state?.file,
  };
}

function idAndType(leaf) {
  return {
    id: leaf.id,
    type: leaf.state?.type,
  };
}

export function transitionLayoutSignature(layout) {
  return {
    active: layout.active,
    main: {
      direction: layout.main?.direction,
      groups: (layout.main?.children || []).map((group) => ({
        id: group.id,
        currentTab: group.currentTab || 0,
        tabs: (group.children || []).map(typeAndFile),
      })),
    },
    left: (layout.left?.children || []).flatMap((group) =>
      (group.children || []).map(idAndType),
    ),
    right: (layout.right?.children || []).flatMap((group) =>
      (group.children || []).map(idAndType),
    ),
  };
}

const visibleControlsCode = `
  const visible=element=>{const style=getComputedStyle(element);const rect=element.getBoundingClientRect();return style.display!=="none"&&style.visibility!=="hidden"&&style.pointerEvents!=="none"&&rect.width>0&&rect.height>0};
  const requiredControlSelectors=[".mod-root .workspace-tab-header-new-tab",".mod-root .workspace-tab-header-tab-list",".mod-root .view-actions",".sidebar-toggle-button"];
  const nativeActionsVisible=requiredControlSelectors.every(selector=>[...document.querySelectorAll(selector)].some(visible));`;

export function transitionObservationCode() {
  return `(()=>{${visibleControlsCode}
    return JSON.stringify({
      layout:app.workspace.getLayout(),
      rootGroupCount:document.querySelectorAll(".workspace-split.mod-root .workspace-tabs").length,
      nativeActionsVisible
    });
  })()`;
}

export function assertTransitionObservation(plan, observation) {
  const actualSignature = transitionLayoutSignature(observation.layout);
  const expectedSignature = transitionLayoutSignature(plan.layout);
  if (!isDeepStrictEqual(actualSignature, expectedSignature)) {
    throw new Error(
      `${plan.transition} transition layout was not established; expected ${JSON.stringify(expectedSignature)}, received ${JSON.stringify(actualSignature)}`,
    );
  }
  if (observation.rootGroupCount !== plan.layout.main.children.length) {
    throw new Error(`${plan.transition} transition produced an invalid root shell count`);
  }
  if (observation.nativeActionsVisible !== true) {
    throw new Error(`${plan.transition} transition hid required native actions`);
  }
}

function assertObservedRole(actual, expected, message) {
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(
      `${message}; expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

export function assertN1ShellObservation(fixture, observation) {
  const expectedSpacing = fixture.topology.edgeFoldExpected ? "8px" : "12px";
  assertObservedRole(
    observation.workspace,
    {
      gridSize: "24px 24px",
      gap: expectedSpacing,
      padding: expectedSpacing,
    },
    `${fixture.id} must preserve the canonical canvas grid and workspace spacing`,
  );
  assertObservedRole(
    observation.ribbon,
    { shadowOffset: [4, 4], cornerRadii: [0, 0, 0, 0] },
    `${fixture.id} ribbon must remain an independent square native utility`,
  );
  if (observation.sideModules.length !== 2) {
    throw new Error(`${fixture.id} must expose two independent side modules`);
  }
  for (const sideModule of observation.sideModules) {
    assertObservedRole(
      sideModule,
      { shadowOffset: [4, 4], cornerRadii: [0, 0, 0, 0] },
      `${fixture.id} side modules must use the square side-module role`,
    );
  }
  if (observation.rootGroups.length !== fixture.topology.rootGroups.length) {
    throw new Error(`${fixture.id} must expose one Cockpit Unit per root tab group`);
  }
  for (const rootGroup of observation.rootGroups) {
    assertObservedRole(
      rootGroup,
      {
        shadowOffset: [5, 5],
        borderWidths: [4, 4, 4, 4],
        cornerRadii: [9, 9, 22, 9],
      },
      `${fixture.id} root groups must own the Cockpit Unit shadow role and contour`,
    );
  }
  if (observation.statusBars.length !== 1) {
    throw new Error(`${fixture.id} must expose the sole global Buffer Cartridge`);
  }
  assertObservedRole(
    observation.statusBars[0],
    {
      shadowOffset: [3, 3],
      borderWidths: [2, 2, 2, 2],
      cornerRadii: [0, 0, 0, 0],
      insetInlineEnd: 18,
      insetBlockEnd: 14,
    },
    `${fixture.id} status bar must own the Buffer Cartridge role`,
  );
  if (observation.gridOwnerCount !== 1) {
    throw new Error(`${fixture.id} canvas grid must belong only to the workspace`);
  }
  assertObservedRole(
    observation.textZoom200,
    {
      rootGroupCount: fixture.topology.rootGroups.length,
      statusBarCount: 1,
      nativeActionsVisible: true,
    },
    `${fixture.id} must preserve native topology and actions at 200% text zoom`,
  );
}

export function fixtureObservationCode(fixture) {
  const expectedReader = JSON.stringify(fixtureReaderPath(fixture));
  const expectedContentIds = JSON.stringify(fixture.requiredContentIds);
  const fixtureId = JSON.stringify(fixture.id);
  return `(()=>{${visibleControlsCode}
    const layout=app.workspace.getLayout();
    const pixelValues=(value)=>[...value.matchAll(/(-?\\d+(?:\\.\\d+)?)px/g)].map(match=>Number(match[1]));
    const shadowOffset=(style)=>pixelValues(style.boxShadow).slice(0,2);
    const cornerRadii=(style)=>[
      style.borderTopLeftRadius,
      style.borderTopRightRadius,
      style.borderBottomRightRadius,
      style.borderBottomLeftRadius
    ].map(value=>Number.parseFloat(value));
    const borderWidths=(style)=>[
      style.borderTopWidth,
      style.borderRightWidth,
      style.borderBottomWidth,
      style.borderLeftWidth
    ].map(value=>Number.parseFloat(value));
    const squareRole=(element)=>{const style=getComputedStyle(element);return {shadowOffset:shadowOffset(style),cornerRadii:cornerRadii(style)}};
    const framedRole=(element)=>{const style=getComputedStyle(element);return {shadowOffset:shadowOffset(style),borderWidths:borderWidths(style),cornerRadii:cornerRadii(style)}};
    const bufferRole=(element)=>{const style=getComputedStyle(element);return {...framedRole(element),insetInlineEnd:Number.parseFloat(style.insetInlineEnd),insetBlockEnd:Number.parseFloat(style.insetBlockEnd)}};
    const backgroundSizes=(style)=>style.backgroundSize.split(",").map(value=>value.trim());
    const workspaceElement=document.querySelector(".workspace");
    const workspaceStyle=getComputedStyle(workspaceElement);
    const rootGroupElements=[...document.querySelectorAll(".workspace-split.mod-root .workspace-tabs")];
    const statusBarElements=[...document.querySelectorAll(".status-bar")];
    const shell={
      workspace:{gridSize:[...new Set(backgroundSizes(workspaceStyle))].join(", "),gap:workspaceStyle.gap,padding:workspaceStyle.padding},
      ribbon:squareRole(document.querySelector(".workspace-ribbon")),
      sideModules:[...document.querySelectorAll(".workspace-split.mod-left-split:not(.is-sidedock-collapsed),.workspace-split.mod-right-split:not(.is-sidedock-collapsed)")].map(squareRole),
      rootGroups:rootGroupElements.map(framedRole),
      statusBars:statusBarElements.map(bufferRole),
      gridOwnerCount:[...document.querySelectorAll("body *")].filter(element=>backgroundSizes(getComputedStyle(element)).includes("24px 24px")).length,
      textZoom200:null
    };
    const originalZoom=document.body.style.zoom;
    document.body.style.zoom="2";
    shell.textZoom200={
      rootGroupCount:document.querySelectorAll(".workspace-split.mod-root .workspace-tabs").length,
      statusBarCount:document.querySelectorAll(".status-bar").length,
      nativeActionsVisible:requiredControlSelectors.every(selector=>[...document.querySelectorAll(selector)].some(visible))
    };
    document.body.style.zoom=originalZoom;
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
    const rootLeaves=(layout.main?.children||[]).flatMap(group=>group.children||[]);
    const rootTypes=groups.flatMap(group=>group.tabs);
    const markdownFiles=rootLeaves.filter(leaf=>leaf.state?.type==="markdown").map(leaf=>leaf.state?.state?.file);
    const canvasFiles=rootLeaves.filter(leaf=>leaf.state?.type==="canvas").map(leaf=>leaf.state?.state?.file);
    const rightBanks=(layout.right?.children||[]).map(group=>normalizeType(group.children?.[group.currentTab||0]?.state?.type));
    const rail=document.querySelector(".mod-root .workspace-tab-header-container-inner");
    const contentChecks={
      "h5-reader-bilingual":markdownFiles.includes(${expectedReader}),
      "h5-graph":rootTypes.includes("graph"),
      "h5-canvas":canvasFiles.includes(${JSON.stringify(canvasFixturePath)}),
      "h5-file-tree":!!document.querySelector(".mod-left-split .workspace-leaf-content[data-type='file-explorer']"),
      "h5-long-bilingual-labels":markdownFiles.includes(${JSON.stringify(longBilingualReaderPath)})
    };
    const requiredContentIds=${expectedContentIds}.filter(contentId=>contentChecks[contentId]===true);
    const groupCount=layout.main?.children?.length||0;
    const rootArrangement=groupCount===1?"single":groupCount===2&&layout.main?.direction==="vertical"?"side-by-side":groupCount===2?"stacked":"invalid";
    return JSON.stringify({
      fixtureId:${fixtureId},
      viewport:{width:window.innerWidth,height:window.innerHeight},
      theme:document.body.classList.contains("theme-dark")?"dark":"light",
      nativeViewTypes:["file-explorer",...new Set(rootTypes),...rightBanks],
      topology:{
        workspaceModel:document.body.classList.contains("is-mobile")?"mobile":"d1-desktop",
        rootArrangement,
        tabRail:rail&&rail.scrollWidth>rail.clientWidth?"overflow-stress":"native",
        edgeFoldExpected:window.innerWidth<=1100,
        leftDockVisible:!(layout.left?.collapsed)&&!!document.querySelector(".mod-left-split:not(.is-sidedock-collapsed)"),
        rightBanks,
        rootGroups:groups,
        nativeActionsVisible
      },
      shell,
      requiredContentIds
    });
  })()`;
}
