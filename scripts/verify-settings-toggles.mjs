// Run against the real Preferences document, including detached settings windows.
// Clones have no plugin listeners: changing their state never enables/disables plugins.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const vault = process.argv[2] ?? "dev-test";
const code = `(() => {
  const tab = app.setting.activeTab;
  if (tab?.id !== 'community-plugins') throw Error('Open Community plugins settings first');
  const source = tab.containerEl.querySelector('.mod-list .setting-item.mod-toggle');
  if (!source) throw Error('An installed plugin row is required');
  const doc = source.ownerDocument, win = doc.defaultView;
  const theme = [...doc.querySelectorAll('style')].find(s =>
    s.textContent.includes('Independent Obsidian theme source'));
  if (!theme || theme.sheet.disabled) throw Error('Enable Pixel first');
  const body = doc.body, originalClass = body.className;
  const row = source.cloneNode(true), probe = doc.createElement('style');
  probe.textContent = '.checkbox-container,.checkbox-container::after {transition:none!important}';
  row.style.cssText = 'position:fixed;left:-10000px;top:0;width:600px';
  source.parentElement.append(row);
  doc.head.append(probe);
  const toggle = row.querySelector('.checkbox-container');
  const results = [];
  try {
    for (const mobile of [false, true]) {
      body.classList.toggle('is-mobile', mobile);
      for (const mode of ['light', 'dark']) {
        body.classList.toggle('theme-light', mode === 'light');
        body.classList.toggle('theme-dark', mode === 'dark');
        for (const enabled of [true, false]) {
          toggle.classList.toggle('is-enabled', enabled);
          for (const disabled of [false, true]) {
            toggle.classList.toggle('is-disabled', disabled);
            const s = win.getComputedStyle(toggle, '::after');
            const matrix = new win.DOMMatrix(s.transform === 'none' ? undefined : s.transform);
            const x = parseFloat(s.left) + parseFloat(s.marginLeft) + matrix.m41;
            const y = parseFloat(s.top) + parseFloat(s.marginTop) + matrix.m42;
            const width = parseFloat(s.width), height = parseFloat(s.height);
            const state = {mobile, mode, enabled, disabled, x, y, width, height,
              trackWidth: toggle.clientWidth, trackHeight: toggle.clientHeight};
            if (![x,y,width,height].every(Number.isFinite) || x < -0.5 || y < -0.5 ||
                x + width > toggle.clientWidth + 0.5 || y + height > toggle.clientHeight + 0.5)
              throw Error('Toggle thumb escapes track: ' + JSON.stringify(state));
            if (enabled ? x < 1 : x > 0.5) throw Error('Incorrect toggle endpoint');
            results.push(state);
          }
        }
      }
    }
    return JSON.stringify({passed: results.length, results});
  } finally {
    body.className = originalClass;
    row.remove();
    probe.remove();
  }
})()`;
const output = execFileSync("obsidian", [`vault=${vault}`, "eval", `code=${code}`], {
  encoding: "utf8",
});
assert.doesNotMatch(output, /Error:/, output);
const result = JSON.parse(output.slice(output.indexOf("=> ") + 3).trim());
assert.equal(result.passed, 16);
console.log(`PASS: ${vault}: 16 toggle states contained (Light/Dark, desktop/mobile CSS, on/off, disabled)`);
