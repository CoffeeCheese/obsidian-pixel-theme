import assert from "node:assert/strict";
import test from "node:test";
import { declaration, ruleBody, matchingRuleBodies, readTheme, ruleBodyForSelector } from "../test-support/theme-css.mjs";

test("image frames fit author widths while Live Preview keeps native widget geometry", async () => {
  const css = await readTheme();
  const rule = selector => ruleBodyForSelector(css, selector);
  assert.equal(declaration(rule('.markdown-rendered .image-embed'), 'display'), 'inline-block');
  const source = rule('.markdown-source-view.mod-cm6 .image-embed');
  assert.equal(declaration(source, 'border-width'), 'var(--pixel-border-decoration)');
  assert.doesNotMatch(source, /(?:^|[;\n])\s*(?:display|position|transform|overflow|width|height):/);
  assert.equal(declaration(rule('.image-embed .image-wrapper'), 'max-inline-size'), '100%');
  assert.equal(declaration(rule('.image-embed img:not([height])'), 'height'), 'auto');
});

test("attachments distinguish available files from missing ones and keep names readable", async () => {
  const css = await readTheme();
  const generic = matchingRuleBodies(css, '.file-embed.mod-generic').find(body => body.includes('border-style: solid'));
  assert.equal(declaration(generic, 'border-style'), 'solid');
  assert.equal(declaration(ruleBodyForSelector(css, '.file-embed.mod-empty'), 'border-style'), 'dashed');
  const title = matchingRuleBodies(css, '.file-embed-title').at(-1);
  assert.equal(declaration(title, 'justify-content'), 'flex-start');
  assert.equal(declaration(title, 'line-height'), '1.65');
  assert.equal(declaration(ruleBodyForSelector(css, '.file-embed-icon'), 'flex-shrink'), '0');
  assert.equal(declaration(ruleBodyForSelector(css, 'body.is-mobile .file-embed.mod-generic'), 'min-block-size'), '44px');
});

test("embedded notes reserve title space for native links and let boundary scrolling reach the page", async () => {
  const css = await readTheme();
  const rule = selector => ruleBodyForSelector(css, selector);
  const title = rule('.markdown-embed.inline-embed > .markdown-embed-title');
  assert.equal(declaration(title, 'padding-inline-end'), 'var(--pixel-space-12)');
  assert.equal(declaration(title, 'font-family'), 'var(--pixel-font-text)');
  const action = '.markdown-embed.inline-embed > .markdown-embed-link';
  assert.equal(declaration(rule(action), 'opacity'), '1');
  assert.match(rule(action), /var\(--pixel-motion-state\)/);
  assert.doesNotMatch(rule(action), /(?:^|[;\n])\s*(?:position|inset|display|pointer-events):/);
  assert.equal(declaration(rule(action + ':hover'), 'border-color'), 'var(--pixel-cyan)');
  assert.equal(declaration(rule(action + ':focus-visible'), 'outline-offset'), '-2px');
  assert.equal(declaration(rule('body.is-mobile ' + action), 'min-inline-size'), '44px');
  assert.equal(declaration(rule('body.is-mobile ' + action), 'min-block-size'), '44px');
  assert.equal(declaration(rule('.inline-embed > .markdown-embed-content'), 'overscroll-behavior'), 'auto');
  assert.equal(declaration(rule('.markdown-embed.inline-embed .markdown-embed.inline-embed > .markdown-embed-content'), 'max-block-size'), 'min(var(--embed-max-height), 360px)');
});

test("mixed lists use a consistent reading indent and completed parents preserve unfinished children", async () => {
  const css = await readTheme();
  const rule = selector => ruleBodyForSelector(css, selector);
  assert.equal(declaration(ruleBody(css, '.markdown-rendered :is(ul, ol) :is(ul, ol) > li'), 'margin-inline-start'), '1.75em');
  assert.equal(declaration(rule('.markdown-rendered li'), 'overflow-wrap'), 'anywhere');
  assert.equal(declaration(rule('.markdown-preview-view .task-list-item-checkbox'), 'top'), '0');
  assert.equal(declaration(ruleBody(css, '.markdown-rendered li.task-list-item > :is(ul, ol)'), 'color'), 'var(--pixel-text)');
  const children = ruleBody(css, '.markdown-rendered li.task-list-item > :is(ul, ol)');
  assert.equal(declaration(children, 'display'), 'inline-block');
  assert.equal(declaration(children, 'inline-size'), '100%');
  assert.equal(declaration(children, 'vertical-align'), 'top');
  const theme = ruleBody(css, '.theme-light,\n.theme-dark');
  assert.equal(declaration(theme, '--list-spacing'), '0.2em');
  assert.equal(declaration(theme, '--checklist-done-decoration'), 'line-through');
});
