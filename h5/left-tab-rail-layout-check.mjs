import { execFileSync } from "node:child_process";

const vault = process.env.OBSIDIAN_H5_VAULT_NAME || "dev-test";

function parseObsidianJson(output) {
  for (const line of output.trim().split(/\r?\n/).reverse()) {
    try {
      return JSON.parse(line.replace(/^=>\s*/, ""));
    } catch {
      // Try the preceding output line.
    }
  }
  throw new Error("Obsidian CLI returned invalid JSON");
}

const code = `JSON.stringify([...document.querySelectorAll(
  ".workspace-split.mod-left-split .workspace-tab-header[data-type]"
)].filter(element=>element.getBoundingClientRect().width>0).map(element=>{
  const style=getComputedStyle(element);
  return {
    type:element.dataset.type,
    label:element.getAttribute("aria-label"),
    borderInlineEnd:style.borderInlineEnd
  };
}))`;
const tabs = parseObsidianJson(
  execFileSync("obsidian", [`vault=${vault}`, "eval", `code=${code}`], {
    encoding: "utf8",
  }),
).filter((tab) => ["file-explorer", "search", "bookmarks"].includes(tab.type));

if (tabs.length !== 3) {
  throw new Error(
    `Expected three visible left rail tabs, received ${tabs.length}`,
  );
}

console.log(JSON.stringify(tabs, null, 2));

const dividedTabs = tabs.filter(
  (tab) => !tab.borderInlineEnd.startsWith("0px "),
);
if (dividedTabs.length > 0) {
  throw new Error(
    `Left rail tabs paint vertical dividers: ${dividedTabs
      .map((tab) => `${tab.label} (${tab.borderInlineEnd})`)
      .join(", ")}`,
  );
}

console.log("PASS: left rail tabs have no vertical dividers");
