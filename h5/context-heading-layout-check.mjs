import { execFileSync } from "node:child_process";

const vault = process.env.OBSIDIAN_H5_VAULT_NAME || "dev-test";
const headingText = process.env.OBSIDIAN_H5_CONTEXT_HEADING || "上下文总览";

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

const code = `(()=>{
  const line=[...document.querySelectorAll(
    ".workspace-split.mod-root .HyperMD-header-1"
  )].find(element=>
    element.textContent?.trim()===${JSON.stringify(headingText)} &&
    element.getBoundingClientRect().width>0
  );
  const text=line?.querySelector(".cm-header-1");
  if(!line||!text)throw new Error("Visible context heading was not found");
  const lineBounds=line.getBoundingClientRect();
  const textBounds=text.getBoundingClientRect();
  const style=getComputedStyle(line);
  const topSpace=textBounds.top-lineBounds.top;
  const bottomSpace=lineBounds.bottom-textBounds.bottom;
  return JSON.stringify({
    heading:${JSON.stringify(headingText)},
    topSpace,
    bottomSpace,
    centerOffset:(textBounds.top+textBounds.bottom-lineBounds.top-lineBounds.bottom)/2,
    lineHeight:lineBounds.height,
    textHeight:textBounds.height,
    paddingTop:style.paddingTop,
    paddingBottom:style.paddingBottom
  });
})()`;

const measurement = parseObsidianJson(
  execFileSync(
    "obsidian",
    [`vault=${vault}`, "eval", `code=${code}`],
    { encoding: "utf8" },
  ),
);

console.log(JSON.stringify(measurement, null, 2));

const tolerance = 1;
if (Math.abs(measurement.centerOffset) > tolerance) {
  throw new Error(
    `Context heading text is not vertically centered: ` +
      `${measurement.centerOffset.toFixed(2)}px center offset ` +
      `(allowed ±${tolerance}px)`,
  );
}

console.log("PASS: context heading text is vertically centered in its background");
