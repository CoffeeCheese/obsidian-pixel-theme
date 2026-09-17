// Real Chromium pseudo-state regression; never clicks or clears the user's query.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const vault = process.argv[2] ?? "dev-test";
const code = `(async () => {
  const doc = app.setting.activeTab?.containerEl.ownerDocument;
  const button = doc?.querySelector('.search-input-clear-button');
  if (!button || !button.getBoundingClientRect().width)
    throw Error('Open settings with a nonempty sidebar search first');
  const win = doc.defaultView;
  const debug = win.require('electron').remote.getCurrentWebContents().debugger;
  if (debug.isAttached()) throw Error('Close DevTools before this verification');
  const originalClass = doc.body.className;
  const input = button.parentElement.querySelector('input');
  const query = input.value;
  let nodeId;
  debug.attach('1.3');
  try {
    await debug.sendCommand('DOM.enable');
    await debug.sendCommand('CSS.enable');
    const {root} = await debug.sendCommand('DOM.getDocument');
    ({nodeId} = await debug.sendCommand('DOM.querySelector', {
      nodeId: root.nodeId, selector: '.search-input-clear-button'
    }));
    const before = button.getBoundingClientRect();
    for (const mode of ['light', 'dark']) {
      doc.body.classList.toggle('theme-light', mode === 'light');
      doc.body.classList.toggle('theme-dark', mode === 'dark');
      for (const state of [[], ['hover'], ['hover', 'active'], ['focus-visible']]) {
        await debug.sendCommand('CSS.forcePseudoState', {nodeId, forcedPseudoClasses: state});
        // Flush style before allowing native color transitions to settle.
        win.getComputedStyle(button).backgroundColor;
        await new Promise(r => setTimeout(r, 250));
        const style = win.getComputedStyle(button);
        const rect = button.getBoundingClientRect();
        if (style.backgroundColor !== 'rgba(0, 0, 0, 0)')
          throw Error('Clear feedback paints over field perimeter: ' + mode + '/' + state + ': ' + style.backgroundColor);
        if (rect.width !== before.width || rect.height !== before.height)
          throw Error('Clear hit target changed');
        if (win.getComputedStyle(button, '::after').maskImage === 'none')
          throw Error('Native clear icon missing');
      }
    }
    if (input.value !== query) throw Error('Search query changed');
    return 'PASS: Light/Dark idle, hover, pressed, focus; native icon and hit target preserved';
  } finally {
    try {
      if (nodeId) await debug.sendCommand('CSS.forcePseudoState', {nodeId, forcedPseudoClasses: []});
    } finally {
      doc.body.className = originalClass;
      debug.detach();
    }
  }
})()`;
const output = execFileSync("obsidian", [`vault=${vault}`, "eval", `code=${code}`], {encoding: "utf8"});
assert.doesNotMatch(output, /Error:/, output);
assert.match(output, /PASS:/);
console.log(output.trim());
