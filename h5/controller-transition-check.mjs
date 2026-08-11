import { execFileSync } from "node:child_process";

const vault = process.env.OBSIDIAN_H5_VAULT_NAME || "dev-test";
const fromPath =
  process.env.OBSIDIAN_H5_CONTROLLER_FROM_PATH ||
  "Pixel Bases QA/记录 01 — 中英混合长标题 Knowledge Item 01.md";
const toPath =
  process.env.OBSIDIAN_H5_CONTROLLER_TO_PATH ||
  "Pixel Bases QA/记录 02 — 中英混合长标题 Knowledge Item 02.md";

function parseObsidianJson(output) {
  for (const line of output.trim().split(/\r?\n/).reverse()) {
    try {
      return JSON.parse(line.replace(/^=>\s*/, ""));
    } catch {
      // Try the preceding output line.
    }
  }
  throw new Error("Obsidian CLI returned invalid controller transition data");
}

const code = `(async()=>{
  const fromPath=${JSON.stringify(fromPath)};
  const toPath=${JSON.stringify(toPath)};
  const row=path=>document.querySelector(
    '.workspace-split.mod-left-split .workspace-leaf-content[data-type="file-explorer"] .nav-file-title[data-path="'+CSS.escape(path)+'"]'
  );
  const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
  const from=row(fromPath);
  const to=row(toPath);
  if(!from||!to)throw new Error('controller transition fixture rows are missing');
  from.click();
  await wait(180);
  const expectedBackground=getComputedStyle(from).backgroundColor;
  to.click();
  const samples=[];
  for(let index=0;index<38;index+=1){
    await wait(8);
    const active=to.matches(':is(.is-active,.is-selected)');
    if(!active)continue;
    const before=getComputedStyle(to,'::before');
    const after=getComputedStyle(to,'::after');
    samples.push({
      milliseconds:(index+1)*8,
      background:getComputedStyle(to).backgroundColor,
      dpad:before.opacity==='0.68'&&before.backgroundImage.includes('linear-gradient'),
      actionButtons:after.content!=='none'&&after.backgroundImage.includes('radial-gradient')
    });
  }
  return JSON.stringify({expectedBackground,samples});
})()`;

const observation = parseObsidianJson(
  execFileSync("obsidian", [`vault=${vault}`, "eval", `code=${code}`], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  }),
);

console.log(JSON.stringify(observation, null, 2));

if (observation.samples.length === 0) {
  throw new Error("Target file never reached an active explorer state");
}

const unstable = observation.samples.filter(
  (sample) =>
    sample.background !== observation.expectedBackground ||
    !sample.dpad ||
    !sample.actionButtons,
);

if (unstable.length > 0) {
  const first = unstable[0];
  throw new Error(
    `Controller selection lost its complete shell for ${unstable.length} sampled frames; ` +
      `first failure at ${first.milliseconds}ms ` +
      `(background ${first.background}, expected ${observation.expectedBackground})`,
  );
}

console.log("PASS: controller selection remains complete while switching files");
