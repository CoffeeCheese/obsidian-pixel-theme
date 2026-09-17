// Live regression check against the installed plugin DOM. Run with Claudian
// open in dev-test; never sends a prompt or changes a conversation.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const code = `(async () => {
  const theme = [...document.querySelectorAll('style')].find(s =>
    s.textContent.includes('Independent Obsidian theme source'));
  if (!theme || theme.sheet.disabled) throw Error('Enable Pixel in dev-test first');
  const selectors = {
    bubble: '.claudian-message-user',
    actions: '.claudian-user-msg-actions',
    navigation: '.claudian-input-nav-btn',
    composer: '.claudian-input-wrapper',
  };
  for (const selector of Object.values(selectors)) {
    if (!document.querySelector(selector)) throw Error('Open a Claudian conversation with a user message first: ' + selector);
  }
  const wait = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const sample = () => Object.fromEntries(Object.entries(selectors).map(([key, selector]) => {
    const element = document.querySelector(selector);
    const style = getComputedStyle(element);
    return [key, {background: style.backgroundColor, border: style.borderWidth,
      height: element.getBoundingClientRect().height, shadow: style.boxShadow}];
  }));
  const host = document.querySelector('.claudian-composer-editor');
  if (!host) throw Error('This runtime check requires Claudian 2.2.7 with CodeMirror');
  const active = document.activeElement;
  const draft = host.value;
  const light = document.body.classList.contains('theme-light');
  const dark = document.body.classList.contains('theme-dark');
  const fixture = document.createElement('div');
  try {
    // Obsidian CLI can focus a background window without dispatching focus.
    // Initialize the real lazy editor using its focus handler, never text input.
    host.focus({preventScroll: true});
    if (!host.querySelector('.cm-editor')) host.dispatchEvent(new FocusEvent('focus'));
    const editor = host.querySelector('.cm-editor');
    const content = host.querySelector('.cm-content[contenteditable="true"]');
    if (!editor || !content) throw Error('CodeMirror editor did not mount');
    fixture.style.cssText = 'position:fixed;left:-10000px;top:0';
    const nativeButton = fixture.appendChild(document.createElement('button'));
    nativeButton.textContent = 'Pixel native control probe';
    document.body.appendChild(fixture);
    const decoration = (element, pseudo = null) => {
      const style = getComputedStyle(element, pseudo);
      return {border: style.borderWidth, outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle, shadow: style.boxShadow,
        background: style.backgroundColor, image: style.backgroundImage,
        content: pseudo ? style.content : null};
    };
    const editorSample = () => [host, editor, content].map(element => ({
      element: decoration(element), before: decoration(element, '::before'),
      after: decoration(element, '::after'),
    }));
    const results = [];
    for (const mode of ['light', 'dark']) {
      document.body.classList.toggle('theme-light', mode === 'light');
      document.body.classList.toggle('theme-dark', mode === 'dark');
      for (const focused of [false, true]) {
        (focused ? content : nativeButton).focus({preventScroll: true});
        theme.sheet.disabled = false;
        await wait();
        if (editor.matches(':focus-within') !== focused) throw Error('Editor focus state did not change');
        const pixel = sample();
        const pixelEditor = editorSample();
        const nativeControl = {height: getComputedStyle(nativeButton).minBlockSize,
          expectedHeight: getComputedStyle(nativeButton).getPropertyValue('--pixel-control-min').trim(),
          border: getComputedStyle(nativeButton).borderTopWidth};
        theme.sheet.disabled = true;
        await wait();
        results.push({mode, focused, pixel, native: sample(), pixelEditor,
          nativeEditor: editorSample(), nativeControl});
      }
    }
    return JSON.stringify({version: app.plugins.plugins.realclaudian.manifest.version, results});
  } finally {
    theme.sheet.disabled = false;
    document.body.classList.toggle('theme-light', light);
    document.body.classList.toggle('theme-dark', dark);
    fixture.remove();
    if (active?.isConnected) active.focus({preventScroll: true});
    if (host.value !== draft) throw Error('Unexpected draft modification');
    await wait();
  }
})()`;
const output = execFileSync("obsidian", ["vault=dev-test", "eval", `code=${code}`], {
  encoding: "utf8",
});
const marker = output.indexOf("=> ");
assert.notEqual(marker, -1, output);
const { version, results } = JSON.parse(output.slice(marker + 3));
for (const { mode, focused, pixel, native, pixelEditor, nativeEditor, nativeControl } of results) {
  assert.equal(pixel.bubble.background, native.bubble.background, `${mode}: extra outer message bubble`);
  assert.equal(pixel.bubble.border, native.bubble.border, `${mode}: extra outer message border`);
  assert.equal(pixel.actions.height, native.actions.height, `${mode}: inflated message action row`);
  assert.equal(pixel.navigation.height, native.navigation.height, `${mode}: inflated navigation button`);
  assert.equal(pixel.composer.shadow, native.composer.shadow, `${mode}: extra composer frame`);
  assert.deepEqual(pixelEditor, nativeEditor, `${mode} focused=${focused}: extra editor decoration`);
  assert.equal(nativeControl.height, nativeControl.expectedHeight, `${mode}: native button lost Pixel sizing`);
  assert.equal(nativeControl.border, "2px", `${mode}: native button lost Pixel border`);
  console.log(`PASS Claudian ${version} ${mode} focused=${focused}: native bubble, actions, editor; Pixel native button preserved`);
}
