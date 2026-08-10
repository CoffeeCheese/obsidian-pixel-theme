import { execFileSync } from "node:child_process";

const vault = process.env.OBSIDIAN_H5_VAULT_NAME || "dev-test";
const settingName = process.env.OBSIDIAN_H5_TOGGLE_SETTING || "自动更新";
const probeStyleId = "pixel-toggle-edge-probe";

function obsidian(...args) {
  return execFileSync("obsidian", [`vault=${vault}`, ...args], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
}

function cdp(method, params) {
  return JSON.parse(
    obsidian("dev:cdp", `method=${method}`, `params=${JSON.stringify(params)}`),
  );
}

function bounds(quad) {
  const xs = quad.filter((_, index) => index % 2 === 0);
  const ys = quad.filter((_, index) => index % 2 === 1);
  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
  };
}

const targetExpression = `(()=>{
  const item=[...document.querySelectorAll(".modal-container .setting-item")]
    .find(element=>element.querySelector(".setting-item-name")?.textContent?.trim()===${JSON.stringify(settingName)});
  return item?.querySelector(".checkbox-container") || null;
})()`;

const originalState = cdp("Runtime.evaluate", {
  expression:
    `(()=>{const toggle=${targetExpression};` +
    `return toggle?.classList.contains("is-enabled") ?? null})()`,
  returnByValue: true,
}).result?.value;

if (originalState === null || originalState === undefined) {
  throw new Error(
    `Visible toggle for setting ${JSON.stringify(settingName)} was not found`,
  );
}

function measure(state) {
  const evaluation = cdp("Runtime.evaluate", {
    expression: `(()=>{
      const toggle=${targetExpression};
      let probe=document.getElementById(${JSON.stringify(probeStyleId)});
      if(!probe){
        probe=document.createElement("style");
        probe.id=${JSON.stringify(probeStyleId)};
        probe.textContent=".checkbox-container::after{transition:none!important}";
        document.head.append(probe);
      }
      toggle.classList.toggle("is-enabled",${state});
      void toggle.offsetWidth;
      return toggle;
    })()`,
    returnByValue: false,
  });
  const objectId = evaluation.result?.objectId;
  if (!objectId) {
    throw new Error("Toggle element was not available through CDP");
  }

  const node = cdp("DOM.describeNode", {
    objectId,
    depth: 1,
    pierce: true,
  }).node;
  const thumb = node.pseudoElements?.find(
    (element) => element.pseudoType === "after",
  );
  if (!thumb) {
    throw new Error(
      "Toggle thumb ::after element was not available through CDP",
    );
  }

  const trackModel = cdp("DOM.getBoxModel", { objectId }).model;
  const thumbModel = cdp("DOM.getBoxModel", {
    backendNodeId: thumb.backendNodeId,
  }).model;
  const trackInner = bounds(trackModel.padding);
  const thumbBorder = bounds(thumbModel.border);

  return {
    state: state ? "on" : "off",
    trackInner,
    thumb: thumbBorder,
    edgeGap: state
      ? trackInner.right - thumbBorder.right
      : thumbBorder.left - trackInner.left,
    verticalOffset:
      (thumbBorder.top + thumbBorder.bottom - trackInner.top - trackInner.bottom) /
      2,
  };
}

let measurements;
try {
  measurements = [measure(false), measure(true)];
} finally {
  cdp("Runtime.evaluate", {
    expression: `(()=>{
      const toggle=${targetExpression};
      toggle?.classList.toggle("is-enabled",${originalState});
      document.getElementById(${JSON.stringify(probeStyleId)})?.remove();
    })()`,
    returnByValue: true,
  });
}

console.log(JSON.stringify(measurements, null, 2));

const tolerance = 0.5;
const detached = measurements.filter(
  ({ edgeGap }) => Math.abs(edgeGap) > tolerance,
);
if (detached.length > 0) {
  throw new Error(
    `Toggle thumb does not meet the track edge: ${detached
      .map(({ state, edgeGap }) => `${state} ${edgeGap.toFixed(2)}px`)
      .join(", ")} (allowed ±${tolerance}px)`,
  );
}

const offCenter = measurements.filter(
  ({ verticalOffset }) => Math.abs(verticalOffset) > tolerance,
);
if (offCenter.length > 0) {
  throw new Error(
    `Toggle thumb is not vertically centered: ${offCenter
      .map(
        ({ state, verticalOffset }) =>
          `${state} ${verticalOffset.toFixed(2)}px`,
      )
      .join(", ")} (allowed ±${tolerance}px)`,
  );
}

console.log(
  "PASS: toggle thumb meets both track edges and is vertically centered",
);
