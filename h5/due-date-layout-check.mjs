import { execFileSync } from "node:child_process";

const vault = process.env.OBSIDIAN_H5_VAULT_NAME || "dev-test";

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

function attribute(node, name) {
  const attributes = node.attributes || [];
  const index = attributes.indexOf(name);
  return index === -1 ? undefined : attributes[index + 1];
}

function descendants(node) {
  return [
    node,
    ...(node.children || []).flatMap(descendants),
    ...(node.shadowRoots || []).flatMap(descendants),
  ];
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

function overlap(first, second) {
  return {
    width: Math.max(
      0,
      Math.min(first.right, second.right) - Math.max(first.left, second.left),
    ),
    height: Math.max(
      0,
      Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top),
    ),
  };
}

const expression =
  'Array.from(document.querySelectorAll(".workspace-split.mod-root input[type=date]")).find(input=>input.getBoundingClientRect().width>0)';
const evaluation = cdp("Runtime.evaluate", {
  expression,
  returnByValue: false,
});
const objectId = evaluation.result?.objectId;

if (!objectId) {
  throw new Error(
    "No visible date property input exists in the active Markdown view",
  );
}

const described = cdp("DOM.describeNode", {
  objectId,
  depth: -1,
  pierce: true,
}).node;
const nodes = descendants(described);
const picker = nodes.find(
  (node) => attribute(node, "pseudo") === "-webkit-calendar-picker-indicator",
);
const fields = nodes.filter((node) =>
  /^-webkit-datetime-edit-(?:year|month|day)-field$/.test(
    attribute(node, "pseudo") || "",
  ),
);

if (!picker || fields.length === 0) {
  throw new Error(
    "Chromium date input shadow parts were not available through CDP",
  );
}

const pickerBounds = bounds(
  cdp("DOM.getBoxModel", { backendNodeId: picker.backendNodeId }).model.border,
);
const measurements = fields.map((field) => {
  const fieldBounds = bounds(
    cdp("DOM.getBoxModel", { backendNodeId: field.backendNodeId }).model.border,
  );
  return {
    field: attribute(field, "aria-label"),
    text: field.children?.[0]?.nodeValue || "",
    bounds: fieldBounds,
    overlap: overlap(fieldBounds, pickerBounds),
  };
});
const collisions = measurements.filter(
  (measurement) =>
    measurement.overlap.width > 0 && measurement.overlap.height > 0,
);

console.log(JSON.stringify({ picker: pickerBounds, fields: measurements }, null, 2));

if (collisions.length > 0) {
  const labels = collisions
    .map(
      ({ field, overlap: collision }) =>
        `${field} (${collision.width.toFixed(2)}px × ${collision.height.toFixed(2)}px)`,
    )
    .join(", ");
  throw new Error(`Date text overlaps the calendar picker indicator: ${labels}`);
}

console.log("PASS: date text and calendar picker indicator do not overlap");
