import assert from 'node:assert/strict';
import test from 'node:test';
import { atRuleBody, declaration, readTheme, ruleBody, ruleBodyForSelector } from '../test-support/theme-css.mjs';

test('heading fold feedback keeps its painted hit box clear of text and exposes keyboard focus', async () => {
  const css = await readTheme();
  const gutter = ruleBodyForSelector(css, 'body .markdown-preview-view.markdown-rendered .heading-collapse-indicator');
  assert.equal(declaration(gutter, 'margin-inline-start'), '0');
  assert.equal(declaration(gutter, 'translate'), 'calc(-100% - var(--pixel-space-1)) 0');
  assert.equal(declaration(ruleBodyForSelector(css, 'body .markdown-preview-view.markdown-rendered .heading-collapse-indicator:dir(rtl)'), 'translate'), 'calc(100% + var(--pixel-space-1)) 0');
  assert.doesNotMatch(gutter, /(?:position|transform|width|height):/);
  for (const selector of ['.markdown-preview-view .heading-collapse-indicator', '.markdown-source-view.mod-cm6 .HyperMD-header .collapse-indicator']) {
    const base = ruleBodyForSelector(css, selector);
    assert.match(base, /var\(--pixel-motion-state\)/);
    assert.doesNotMatch(base, /(?:^|[;\n])\s*(?:position|transform|margin|padding|width|height):/);
    assert.equal(declaration(ruleBodyForSelector(css, selector + ':focus-visible'), 'opacity'), '1');
    assert.equal(declaration(ruleBodyForSelector(css, selector + ':hover'), 'background-color'), 'var(--pixel-surface-secondary)');
  }
});

test('outline and reference titles wrap while counts retain their own space', async () => {
  const css = await readTheme();
  for (const selector of ['.workspace-leaf-content[data-type=outline] .tree-item-inner-text', '.workspace-leaf-content[data-type=backlink] .search-result-file-title .tree-item-inner', '.workspace-leaf-content[data-type=outgoing-link] .tree-item-inner']) {
    const r = ruleBodyForSelector(css, selector);
    assert.equal(declaration(r, 'white-space'), 'normal');
    assert.equal(declaration(r, 'overflow-wrap'), 'anywhere');
  }
  for (const type of ['backlink', 'outgoing-link']) {
    assert.equal(declaration(ruleBodyForSelector(css, `.workspace-leaf-content[data-type=${type}] .tree-item-flair-outer`), 'flex-shrink'), '0');
  }
  assert.equal(declaration(ruleBodyForSelector(css, '.workspace-leaf-content[data-type=backlink] .search-result-file-matches'), 'line-height'), '1.65');
  assert.equal(declaration(ruleBodyForSelector(css, '.workspace-leaf-content[data-type=outgoing-link] .tree-item-inner-subtext'), 'color'), 'var(--pixel-text-muted)');
  assert.equal(declaration(ruleBodyForSelector(css, 'body.is-mobile .workspace-leaf-content[data-type=outline] .tree-item-self'), 'min-block-size'), '44px');
  assert.equal(declaration(ruleBodyForSelector(css, '.workspace-leaf-content[data-type=outline] .tree-item-self:focus-visible'), 'outline-offset'), '-2px');
});

test('print releases scroll limits and exports readable code and tables without controls', async () => {
  const css = await readTheme(), print = atRuleBody(css, '@media print');
  const r = selector => ruleBodyForSelector(print, selector);
  assert.equal(declaration(r('.print'), '--pixel-paper'), '#fff');
  assert.equal(declaration(r('.print'), '--table-column-min-width'), '0');
  assert.equal(declaration(r('.print'), '--table-row-alt-background'), '#fff');
  assert.equal(declaration(r('.print .markdown-rendered pre > code'), 'white-space'), 'pre-wrap');
  assert.equal(declaration(r('.print .markdown-rendered pre > code'), 'overflow'), 'visible');
  assert.equal(declaration(r('.print .markdown-rendered pre > button.copy-code-button:not(.clickable-icon):not(.mod-settings *)'), 'display'), 'none');
  assert.equal(declaration(r('.print .markdown-rendered table'), 'table-layout'), 'fixed');
  assert.equal(declaration(r('.print .markdown-rendered .markdown-embed-content'), 'max-block-size'), 'none');
  assert.equal(declaration(r('.print .markdown-rendered tr'), 'break-inside'), 'avoid');
  assert.equal(declaration(ruleBody(print, '.print .markdown-rendered :is(h1, h2, h3, h4, h5, h6)'), 'break-after'), 'avoid');
  assert.doesNotMatch(print, /@page|size:\s*a4|position:\s*fixed/i);
});
