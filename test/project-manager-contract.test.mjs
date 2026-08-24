import assert from "node:assert/strict";
import test from "node:test";
import {
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

const modal = "body:not(.is-mobile) .modal.pm-modal--task";
const projectModal = "body:not(.is-mobile) .modal.pm-modal--project";
const view = ".workspace-leaf-content.pm-view";
const table = ".workspace-leaf-content.pm-view .pm-table-view";
const settingsCta =
  ".mod-settings .vertical-tab-content.pm-settings .setting-item-control > button.mod-cta";

test("Project Manager project titles use the available space before truncating", async () => {
  const css = await readTheme();

  const toolbarLeft = ruleBody(css, `${view} .pm-toolbar-left`);
  assert.equal(declaration(toolbarLeft, "min-inline-size"), "0");

  const detailTitle = ruleBody(
    css,
    `${view} .pm-toolbar-left > .pm-toolbar-title`,
  );
  assert.equal(declaration(detailTitle, "max-inline-size"), "none");
  assert.equal(declaration(detailTitle, "flex"), "1 1 auto");
  assert.equal(declaration(detailTitle, "white-space"), "normal");
  assert.equal(declaration(detailTitle, "overflow-wrap"), "anywhere");
  assert.equal(declaration(detailTitle, "text-overflow"), "clip");

  const cardTitle = ruleBody(css, `${view} .pm-project-card-title`);
  assert.equal(declaration(cardTitle, "display"), "-webkit-box");
  assert.equal(declaration(cardTitle, "-webkit-box-orient"), "vertical");
  assert.equal(declaration(cardTitle, "-webkit-line-clamp"), "2");
  assert.equal(declaration(cardTitle, "white-space"), "normal");
  assert.equal(declaration(cardTitle, "overflow-wrap"), "anywhere");
});

test("Project Manager table assignees show complete names as contact plates", async () => {
  const css = await readTheme();
  const cell = ruleBody(css, `${table} .pm-table-cell-assignees`);
  assert.equal(declaration(cell, "min-inline-size"), "128px");

  const stack = ruleBody(css, `${table} .pm-avatar-stack`);
  assert.equal(declaration(stack, "max-inline-size"), "184px");
  assert.equal(declaration(stack, "flex-wrap"), "wrap");
  assert.equal(declaration(stack, "gap"), "4px");

  const avatarSelector = `${table} .pm-avatar-stack > .pm-avatar:not(.pm-avatar--more)[aria-label]`;
  const avatar = ruleBody(css, avatarSelector);
  assert.equal(declaration(avatar, "inline-size"), "auto");
  assert.equal(declaration(avatar, "block-size"), "26px");
  assert.equal(declaration(avatar, "border-radius"), "8px");
  assert.equal(declaration(avatar, "font-size"), "0");
  assert.equal(declaration(avatar, "overflow"), "hidden");

  const emoji = ruleBody(css, `${avatarSelector}::before`);
  assert.equal(
    declaration(emoji, "content"),
    'var(--pixel-pm-avatar-emoji, "🐣")',
  );
  assert.equal(declaration(emoji, "inline-size"), "25px");
  assert.match(declaration(emoji, "font-family"), /apple color emoji/);
  assert.equal(declaration(emoji, "font-size"), "14px");

  const name = ruleBody(css, `${avatarSelector}::after`);
  assert.equal(declaration(name, "content"), "attr(aria-label)");
  assert.equal(declaration(name, "white-space"), "nowrap");
  assert.equal(declaration(name, "font-size"), "11.5px");

  const followingAvatar = ruleBody(
    css,
    `${table} .pm-avatar-stack > .pm-avatar:not(:first-child)`,
  );
  assert.equal(declaration(followingAvatar, "margin-inline-start"), "0");

  const firstEmojiRow = ruleBody(
    css,
    `${table} .pm-table-row:nth-child(8n+1)`,
  );
  assert.equal(
    declaration(firstEmojiRow, "--pixel-pm-avatar-emoji"),
    '"🐣"',
  );

  const secondAssignee = ruleBody(
    css,
    `${table} .pm-avatar-stack > .pm-avatar:nth-child(2)`,
  );
  assert.equal(
    declaration(secondAssignee, "--pixel-pm-avatar-emoji"),
    '"🦄"',
  );
});

test("Project Manager project settings dock actions against the modal edge", async () => {
  const css = await readTheme();
  const sheet = ruleBody(css, projectModal);

  assert.equal(declaration(sheet, "inline-size"), "min(560px, 100vw - 48px)");
  assert.equal(declaration(sheet, "padding"), "0");
  assert.equal(declaration(sheet, "overflow"), "hidden");
  assert.equal(
    declaration(sheet, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-pm-project-edge)",
  );

  const content = ruleBody(
    css,
    `${projectModal} > .modal-content.pm-project-modal`,
  );
  assert.equal(declaration(content, "min-block-size"), "0");
  assert.equal(declaration(content, "max-block-size"), "inherit");
  assert.equal(declaration(content, "padding"), "20px 24px 0");
  assert.equal(declaration(content, "overflow-y"), "auto");
  assert.equal(declaration(content, "scroll-padding-block"), "20px 68px");

  const footer = ruleBody(css, `${projectModal} .pm-modal-footer`);
  assert.equal(declaration(footer, "inset-block-end"), "0");
  assert.equal(declaration(footer, "inline-size"), "calc(100% + 48px)");
  assert.equal(declaration(footer, "margin-inline"), "-24px");
  assert.equal(declaration(footer, "margin-block-end"), "0");
  assert.equal(declaration(footer, "padding"), "10px 24px");
  assert.match(
    declaration(footer, "border-block-start"),
    /--pixel-pm-project-edge-quiet/,
  );
});

test("Project Manager settings fields share one quiet edge model", async () => {
  const css = await readTheme();
  const settingsFields = `${projectModal} .pm-input`;
  const field = ruleBody(css, settingsFields);

  assert.equal(
    declaration(field, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-search-edge)",
  );
  assert.equal(declaration(field, "outline"), "0");
  assert.equal(declaration(field, "box-shadow"), "none");

  const focusedField = ruleBody(
    css,
    `${settingsFields}:is(:focus, :focus-visible)`,
  );
  assert.equal(declaration(focusedField, "border-color"), "var(--pixel-cyan)");
  assert.equal(declaration(focusedField, "outline"), "0");
  assert.equal(
    declaration(focusedField, "box-shadow"),
    "var(--pixel-search-focus-shadow)",
  );
});

test("Project Manager settings add actions remain legible on Pixel surfaces", async () => {
  const css = await readTheme();
  const button = ruleBody(css, settingsCta);

  assert.equal(declaration(button, "color"), "var(--pixel-text)");
  assert.doesNotMatch(
    declaration(button, "box-shadow"),
    /inset 3px 0 0 var\(--pixel-cyan\)/,
  );
  assert.equal(
    declaration(button, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 6%, var(--pixel-paper))",
  );
  assert.match(declaration(button, "border-color"), /--pixel-cyan/);

  const rail = ruleBody(css, `${settingsCta}::before`);
  assert.equal(declaration(rail, "content"), '""');
  assert.equal(
    declaration(rail, "inset-block"),
    "calc(-1 * var(--pixel-border-decoration))",
  );
  assert.equal(
    declaration(rail, "inset-inline-start"),
    "calc(-1 * var(--pixel-border-decoration))",
  );
  assert.equal(declaration(rail, "border-start-start-radius"), "inherit");
  assert.equal(declaration(rail, "border-end-start-radius"), "inherit");
  assert.equal(declaration(rail, "opacity"), "0");
  assert.equal(declaration(rail, "transform"), "scaley(0)");

  const hoveredButton = ruleBody(css, `${settingsCta}:hover`);
  assert.match(
    declaration(hoveredButton, "border-color"),
    /color-mix\(in srgb, var\(--pixel-cyan\) 62%/,
  );

  const hoveredRail = ruleBody(css, `${settingsCta}:hover::before`);
  assert.equal(declaration(hoveredRail, "opacity"), "1");
  assert.equal(declaration(hoveredRail, "transform"), "scaley(1)");

  const active = ruleBody(css, `${settingsCta}:active`);
  assert.equal(declaration(active, "transform"), "translatey(1px)");

  const focus = ruleBody(css, `${settingsCta}:focus-visible`);
  assert.equal(declaration(focus, "outline"), "0");
  assert.match(declaration(focus, "box-shadow"), /--pixel-cyan/);
  assert.doesNotMatch(
    declaration(focus, "box-shadow"),
    /inset 3px 0 0 var\(--pixel-cyan\)/,
  );
});

test("Project Manager custom-field controls use a clear two-level hierarchy", async () => {
  const css = await readTheme();
  const fieldName = ruleBody(css, `${projectModal} input.pm-cf-name`);
  const typeSelect = ruleBody(
    css,
    `${projectModal} select.pm-cf-type`,
  );
  const optionInput = ruleBody(
    css,
    `${projectModal} input.pm-cf-opt-input`,
  );

  assert.equal(declaration(fieldName, "block-size"), "38px");
  assert.equal(declaration(fieldName, "min-block-size"), "38px");

  assert.equal(declaration(typeSelect, "block-size"), "38px");
  assert.equal(declaration(typeSelect, "min-block-size"), "38px");
  assert.equal(declaration(typeSelect, "padding-block"), "7px");
  assert.equal(declaration(typeSelect, "line-height"), "1.5");
  assert.equal(declaration(typeSelect, "appearance"), "menulist");
  assert.equal(declaration(typeSelect, "background-position"), "0 0");
  assert.match(declaration(typeSelect, "background-image"), /linear-gradient/);
  assert.equal(declaration(typeSelect, "background-size"), "100% 100%");

  assert.equal(declaration(optionInput, "block-size"), "32px");
  assert.equal(declaration(optionInput, "min-block-size"), "32px");
  assert.equal(
    declaration(optionInput, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-pm-project-edge-quiet)",
  );
});

test("Project Manager task editor uses a compact macOS sheet with a Pixel edge", async () => {
  const css = await readTheme();
  const sheet = ruleBody(css, modal);

  assert.equal(declaration(sheet, "inline-size"), "min(760px, 100vw - 48px)");
  assert.equal(declaration(sheet, "max-block-size"), "min(86vh, 820px)");
  assert.equal(
    declaration(sheet, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-pm-edge)",
  );
  assert.match(declaration(sheet, "box-shadow"), /2px 2px 0 var\(--pixel-shadow-color\)/);
  assert.match(declaration(sheet, "box-shadow"), /0 20px 52px/);
  assert.equal(declaration(sheet, "font-size"), "13px");
});

test("Project Manager uses only its own close action", async () => {
  const css = await readTheme();
  const nativeChrome = ruleBodyForSelector(
    css,
    `${modal} > .modal-header-button`,
  );
  assert.equal(declaration(nativeChrome, "display"), "none");

  const action = ruleBody(
    css,
    `${modal} .pm-te-header-btn.clickable-icon`,
  );
  assert.equal(declaration(action, "inline-size"), "28px");
  assert.equal(declaration(action, "block-size"), "28px");
  assert.equal(declaration(action, "box-shadow"), "none");
});

test("Project Manager long titles and dense properties stay readable", async () => {
  const css = await readTheme();
  const title = ruleBody(css, `${modal} textarea.pm-te-title`);
  assert.equal(declaration(title, "border"), "0");
  assert.equal(declaration(title, "box-shadow"), "none");
  assert.equal(declaration(title, "font-size"), "19px");
  assert.equal(declaration(title, "line-height"), "1.42");

  const grid = ruleBody(css, `${modal} .pm-prop-grid`);
  assert.equal(
    declaration(grid, "grid-template-columns"),
    "repeat(2, minmax(0, 1fr))",
  );

  const row = ruleBody(css, `${modal} .pm-prop-grid .pm-prop-row`);
  assert.equal(
    declaration(row, "grid-template-columns"),
    "92px minmax(0, 1fr)",
  );

  const inlineControl = ruleBodyForSelector(
    css,
    `${modal} button.pm-prop-inline`,
  );
  assert.equal(declaration(inlineControl, "min-block-size"), "27px");
  assert.equal(
    declaration(inlineControl, "border"),
    "var(--pixel-border-decoration) solid transparent",
  );
  assert.equal(declaration(inlineControl, "box-shadow"), "none");
  assert.equal(declaration(inlineControl, "font-size"), "12.5px");
});

test("Project Manager task tags reuse Pixel's compact tag language", async () => {
  const css = await readTheme();
  const chips = ruleBody(css, `${modal} .pm-prop-chips`);
  const tagSelector = `${modal} .pm-chip.pm-chip--tag`;
  const tag = ruleBody(css, tagSelector);
  const removeSelector = `${modal} .pm-chip--tag > button.pm-chip-rm`;
  const remove = ruleBody(css, removeSelector);
  const removeIcon = ruleBody(css, `${removeSelector} .svg-icon`);

  assert.equal(declaration(chips, "align-items"), "center");
  assert.equal(declaration(chips, "gap"), "4px");

  assert.equal(declaration(tag, "min-block-size"), "22px");
  assert.equal(
    declaration(tag, "border"),
    "var(--tag-border-width) solid var(--tag-border-color)",
  );
  assert.equal(declaration(tag, "border-radius"), "var(--tag-radius)");
  assert.equal(declaration(tag, "background"), "var(--tag-background)");
  assert.equal(declaration(tag, "color"), "var(--tag-color)");
  assert.equal(declaration(tag, "box-shadow"), "var(--pixel-tag-highlight)");
  assert.equal(declaration(tag, "font-weight"), "var(--tag-weight)");

  assert.equal(declaration(remove, "inline-size"), "18px");
  assert.equal(declaration(remove, "min-inline-size"), "18px");
  assert.equal(declaration(remove, "block-size"), "18px");
  assert.equal(declaration(remove, "min-block-size"), "18px");
  assert.equal(declaration(remove, "border"), "0");
  assert.equal(declaration(remove, "background"), "transparent");
  assert.equal(declaration(remove, "box-shadow"), "none");
  assert.equal(declaration(remove, "transform"), "none");
  assert.equal(declaration(removeIcon, "inline-size"), "10px");
  assert.equal(declaration(removeIcon, "block-size"), "10px");

  const focused = ruleBody(css, `${tagSelector}:focus-within`);
  assert.equal(
    declaration(focused, "border-color"),
    "var(--tag-border-color-hover)",
  );
  assert.equal(
    declaration(focused, "background"),
    "var(--tag-background-hover)",
  );

  const focusedRemove = ruleBody(css, `${removeSelector}:focus-visible`);
  assert.equal(declaration(focusedRemove, "box-shadow"), "none");
  assert.equal(declaration(focusedRemove, "opacity"), "1");
});

test("Project Manager form fields share the search field interaction model", async () => {
  const css = await readTheme();
  const formFields = `${modal} :is(input.pm-prop-text,\nselect.pm-prop-select,\ninput.pm-subtask-add-input)`;
  const fields = ruleBody(css, formFields);

  assert.equal(
    declaration(fields, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-search-edge)",
  );
  assert.equal(declaration(fields, "outline"), "0");
  assert.equal(declaration(fields, "box-shadow"), "none");
  assert.match(declaration(fields, "transition"), /border-color/);
  assert.match(declaration(fields, "transition"), /box-shadow/);

  const focused = ruleBody(
    css,
    `${formFields}:is(:focus, :focus-visible)`,
  );
  assert.equal(declaration(focused, "border-color"), "var(--pixel-cyan)");
  assert.equal(declaration(focused, "outline"), "0");
  assert.equal(
    declaration(focused, "box-shadow"),
    "var(--pixel-search-focus-shadow)",
  );

  const hoverMedia = css.slice(css.indexOf(formFields));
  const hovered = ruleBody(
    hoverMedia,
    `${modal} :is(input.pm-prop-text,\n  select.pm-prop-select,\n  input.pm-subtask-add-input):hover:not(:focus):not(:focus-visible)`,
  );
  assert.equal(
    declaration(hovered, "border-color"),
    "var(--pixel-search-edge-hover)",
  );
});

test("Project Manager checkboxes align with labels and keep light interaction states", async () => {
  const css = await readTheme();
  const checkboxSelector = `${modal} input.pm-prop-checkbox`;
  const checkbox = ruleBody(css, checkboxSelector);
  assert.equal(declaration(checkbox, "inline-size"), "16px");
  assert.equal(declaration(checkbox, "block-size"), "16px");
  assert.equal(declaration(checkbox, "margin"), "5.5px 0 0");
  assert.equal(
    declaration(checkbox, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-search-edge)",
  );
  assert.equal(declaration(checkbox, "box-shadow"), "none");
  assert.equal(declaration(checkbox, "cursor"), "pointer");
  assert.match(declaration(checkbox, "transition"), /transform/);

  const marker = ruleBody(css, `${checkboxSelector}:checked::after`);
  assert.equal(declaration(marker, "inline-size"), "10px");
  assert.equal(declaration(marker, "block-size"), "8px");
  assert.equal(declaration(marker, "inset"), "3px auto auto 3px");
  assert.equal(declaration(marker, "mask-size"), "10px 8px");

  const checked = ruleBody(css, `${checkboxSelector}:checked`);
  assert.equal(declaration(checked, "border-color"), "var(--pixel-cyan)");
  assert.equal(declaration(checked, "background-color"), "var(--pixel-cyan)");
  assert.match(declaration(checked, "box-shadow"), /inset 0 -1px 0/);

  const focused = ruleBody(css, `${checkboxSelector}:focus-visible`);
  assert.equal(declaration(focused, "outline"), "0");
  assert.match(declaration(focused, "box-shadow"), /0 0 0 2px/);

  const pressed = ruleBody(css, `${checkboxSelector}:active`);
  assert.equal(declaration(pressed, "transform"), "scale(0.88)");

  const checkboxCss = css.slice(css.indexOf(checkboxSelector));
  const hovered = ruleBody(
    checkboxCss,
    `${checkboxSelector}:hover:not(:checked)`,
  );
  assert.equal(
    declaration(hovered, "border-color"),
    "var(--pixel-search-edge-hover)",
  );
});

test("Project Manager collapses its property grid in narrow desktop windows", async () => {
  const css = await readTheme();
  const media = css.slice(css.indexOf("@media (max-width: 720px)"));
  const grid = ruleBody(media, `${modal} .pm-prop-grid`);
  assert.equal(declaration(grid, "grid-template-columns"), "minmax(0, 1fr)");
});
