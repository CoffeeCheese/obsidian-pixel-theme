import assert from "node:assert/strict";
import test from "node:test";
import {
  atRuleBody,
  declaration,
  readTheme,
  ruleBody,
  ruleBodyForSelector,
} from "../test-support/theme-css.mjs";

function combinedAtRuleBody(css, prelude) {
  const bodies = [];
  let offset = 0;
  let start = css.indexOf(prelude, offset);

  while (start !== -1) {
    bodies.push(atRuleBody(css.slice(start), prelude));
    offset = start + prelude.length;
    start = css.indexOf(prelude, offset);
  }

  return bodies.join("\n");
}

test("primary actions retain tactile motion while separating semantic button roles", async () => {
  const css = await readTheme();
  const exclusions = ":not(.mod-destructive):not(.mod-warning):not(.mod-loading)";
  const enabled = `${exclusions}:not(:disabled):not([aria-disabled=true])`;
  const surfaces = [
    "button.mod-cta:not(.clickable-icon):not(.mod-settings *)",
    ".mod-settings .setting-item .setting-item-control > button.mod-cta:not(.clickable-icon)",
  ];
  for (const surface of surfaces) {
    const resting = ruleBodyForSelector(css, `${surface}:where(${exclusions})`);
    assert.equal(declaration(resting, "background-color"), "var(--pixel-cyan)");
    assert.equal(declaration(resting, "color"), "var(--pixel-button-primary-text)");
    assert.equal(declaration(resting, "--pixel-mobile-control-surface"), "var(--pixel-cyan)");
    assert.equal(declaration(resting, "--pixel-mobile-control-active"), "var(--pixel-button-primary-hover)");
    assert.equal(declaration(resting, "--pixel-mobile-control-border"), "var(--pixel-cyan)");
    assert.equal(declaration(resting, "border-color"), "var(--pixel-cyan)");
    assert.equal(declaration(resting, "font-weight"), "650");
    assert.doesNotMatch(resting, /(?:transform|transition|box-shadow|padding|outline):/);
    for (const state of ["hover", "active"]) {
      const body = ruleBodyForSelector(css, `${surface}:where(${enabled}):${state}`);
      assert.equal(declaration(body, "background-color"), "var(--pixel-button-primary-hover)");
      assert.equal(declaration(body, "color"), "var(--pixel-button-primary-text)");
      assert.doesNotMatch(body, /(?:transform|transition|box-shadow|outline):/);
    }
  }
  const forcedColors = atRuleBody(css, "@media (forced-colors: active)");
  const palette = ruleBodyForSelector(forcedColors, ".theme-light");
  assert.equal(declaration(palette, "--pixel-button-primary-hover"), "highlight");
  assert.equal(declaration(palette, "--pixel-button-primary-text"), "highlighttext");
});

test("settings hover is quiet and cannot replace the focused row marker", async () => {
  const css = await readTheme();
  const row = ".mod-settings .vertical-tab-content .setting-item:not(.setting-item-heading)";
  const hover = ruleBody(css, `${row}:hover`);
  const focused = ruleBody(css, `${row}:focus-within`);
  assert.equal(declaration(hover, "background-color"), "var(--pixel-settings-card-surface-hover)");
  assert.doesNotMatch(hover, /box-shadow:|transform:|padding:|margin:/);
  assert.match(declaration(focused, "box-shadow"), /inset 3px 0 0 var\(--pixel-cyan\)/);
});

test("compiled controls share Pixel surfaces, meaningful boundaries, and motion", async () => {
  const css = await readTheme();
  const body = ruleBody(css, "body");
  const themeMapping = ruleBody(css, ".theme-light,\n.theme-dark");

  const expectedTokens = {
    "--pixel-motion-press": "80ms",
    "--pixel-motion-state": "120ms",
    "--pixel-motion-surface": "160ms",
    "--pixel-motion-button": "160ms",
    "--pixel-motion-toggle": "200ms",
    "--pixel-motion-toggle-color": "160ms",
    "--pixel-motion-toggle-press": "100ms",
    "--pixel-control-min": "32px",
    "--pixel-state-min-block-size": "48px",
  };
  for (const [property, value] of Object.entries(expectedTokens)) {
    assert.equal(declaration(body, property), value);
  }

  const expectedMappings = {
    "--input-border-width": "var(--pixel-border-control)",
    "--input-border-width-focus": "var(--pixel-border-control)",
    "--input-shadow": "var(--pixel-shadow-control)",
    "--input-shadow-hover": "var(--pixel-shadow-control)",
    "--modal-background": "var(--pixel-paper)",
    "--modal-border-color": "var(--pixel-border-meaningful)",
    "--modal-border-width": "var(--pixel-border-control)",
    "--menu-background": "var(--pixel-paper)",
    "--menu-border-color": "var(--pixel-border-meaningful)",
    "--menu-border-width": "var(--pixel-border-control)",
    "--prompt-background": "var(--pixel-paper)",
    "--prompt-border-color": "var(--pixel-border-meaningful)",
    "--prompt-border-width": "var(--pixel-border-control)",
    "--suggestion-background": "var(--pixel-paper)",
    "--setting-items-background": "var(--pixel-paper)",
    "--setting-items-border-color": "var(--pixel-border-meaningful)",
    "--setting-items-border-width": "0px",
  };
  for (const [property, value] of Object.entries(expectedMappings)) {
    assert.equal(declaration(themeMapping, property), value);
  }
});

test("settings toggles glide between edges with a cushioned press", async () => {
  const css = await readTheme();
  const track = ruleBodyForSelector(css, ".checkbox-container");
  assert.match(
    declaration(track, "transition"),
    /background-color var\(--pixel-motion-toggle-color\) var\(--pixel-ease-toggle\)/,
  );

  const thumb = ruleBody(css, ".modal label.checkbox-container::after");
  assert.equal(declaration(thumb, "transform"), "scaley(1)");
  assert.equal(declaration(thumb, "transform-origin"), "center");
  assert.match(
    declaration(thumb, "transition"),
    /inset-inline-start var\(--pixel-motion-toggle\) var\(--pixel-ease-toggle\)/,
  );
  assert.match(
    declaration(thumb, "transition"),
    /transform var\(--pixel-motion-toggle-press\) var\(--pixel-ease-toggle\)/,
  );

  const pressed = ruleBody(
    css,
    ".modal label.checkbox-container:not(.is-disabled):active::after",
  );
  assert.equal(declaration(pressed, "transform"), "scaley(0.9)");
  assert.equal(declaration(pressed, "opacity"), "1");
});

test("settings search uses a quiet hairline edge with an explicit focus signal", async () => {
  const css = await readTheme();
  const base = ruleBody(css, "input[type=search]");
  assert.equal(
    declaration(base, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-search-edge)",
  );
  assert.equal(declaration(base, "outline"), "0");
  assert.equal(declaration(base, "box-shadow"), "none");

  const baseFocus = ruleBody(
    css,
    "input[type=search]:is(:focus, :focus-visible)",
  );
  assert.equal(declaration(baseFocus, "border-color"), "var(--pixel-cyan)");
  assert.equal(declaration(baseFocus, "outline"), "0");
  assert.equal(
    declaration(baseFocus, "box-shadow"),
    "var(--pixel-search-focus-shadow)",
  );

  const selector =
    ".mod-settings .setting-search-container input[type=search]";
  const field = ruleBody(css, selector);

  assert.equal(
    declaration(field, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-search-edge)",
  );
  assert.equal(declaration(field, "box-shadow"), "none");
  assert.match(declaration(field, "transition"), /box-shadow/);

  const focus = ruleBody(css, `${selector}:focus`);
  assert.equal(declaration(focus, "outline"), "0");
  assert.equal(declaration(focus, "border-color"), "var(--pixel-cyan)");
  assert.equal(
    declaration(focus, "box-shadow"),
    "var(--pixel-search-focus-shadow)",
  );

  const hover = ruleBody(css, `${selector}:hover:not(:focus)`);
  assert.match(
    declaration(hover, "border-color"),
    /var\(--pixel-search-edge-hover\) 86%/,
  );

  const focusedIcon = ruleBody(
    css,
    ".mod-settings .setting-search-container .search-input-container:focus-within::before",
  );
  assert.equal(declaration(focusedIcon, "background-color"), "var(--pixel-cyan)");

  const typedSearchRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((match) => match[1].includes("input[type=search]"));
  assert.ok(typedSearchRules.length >= 8, "expected all native search contexts");
  for (const [, ruleSelector, ruleDeclarations] of typedSearchRules) {
    assert.doesNotMatch(
      ruleDeclarations,
      /border(?:-(?:width|block|inline)(?:-[a-z]+)?)?\s*:[^;]*(?:--pixel-border-control|--pixel-border-shell)/i,
      `thick search border in ${ruleSelector.trim()}`,
    );
    for (const edge of ruleDeclarations.matchAll(
      /(?:outline|box-shadow)\s*:\s*([^;]+)/gi,
    )) {
      assert.ok(
        ["0", "0px", "none", "var(--pixel-search-focus-shadow)"].includes(
          edge[1].trim().toLowerCase(),
        ),
        `stacked search edge in ${ruleSelector.trim()}`,
      );
    }
  }
});

test("settings sidebar navigation uses a stable soft hover slot", async () => {
  const css = await readTheme();
  const selector = ".mod-settings .vertical-tab-nav-item";
  const item = ruleBody(css, selector);

  assert.match(
    declaration(item, "transition"),
    /background-color var\(--pixel-motion-state\) linear/,
  );

  const feedback = ruleBody(
    css,
    `${selector}:not(.is-active):is(:hover, :focus-visible)`,
  );
  assert.equal(
    declaration(feedback, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 5%, var(--pixel-paper))",
  );
  assert.doesNotMatch(feedback, /(?:transform|box-shadow)\s*:/i);

  const reducedMotion = atRuleBody(css, "@media (prefers-reduced-motion: reduce)");
  const motionless = ruleBodyForSelector(reducedMotion, selector);
  assert.equal(declaration(motionless, "transition-duration"), "0ms");
});

test("preferences give every native setting a quiet Pixel card without styling headings", async () => {
  const css = await readTheme();
  const themeMapping = ruleBody(css, ".theme-light,\n.theme-dark");
  const preferences = ruleBody(css, ".mod-settings");

  assert.equal(declaration(themeMapping, "--setting-items-border-width"), "0px");
  assert.equal(
    declaration(preferences, "--input-border-width"),
    "var(--pixel-border-decoration)",
  );
  assert.equal(
    declaration(preferences, "--input-border-width-focus"),
    "var(--pixel-border-decoration)",
  );
  assert.equal(declaration(preferences, "--input-shadow"), "none");
  assert.equal(declaration(preferences, "--input-shadow-hover"), "none");

  const nativeControl = ruleBody(
    css,
    ".mod-settings .setting-item-control > :is(button:not(.clickable-icon),\ninput:not([type=checkbox]):not([type=radio]):not([type=color]),\ntextarea,\nselect.dropdown,\n.combobox-button)",
  );
  assert.equal(
    declaration(nativeControl, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-settings-edge)",
  );
  assert.equal(declaration(nativeControl, "border-radius"), "var(--pixel-radius)");
  assert.equal(
    declaration(nativeControl, "background-color"),
    "var(--pixel-settings-surface)",
  );

  const raisedButton = ruleBody(
    css,
    "button:not(.clickable-icon):not(.mod-settings *)",
  );
  assert.equal(
    declaration(raisedButton, "box-shadow"),
    "var(--pixel-shadow-button)",
  );

  const card = ruleBody(
    css,
    ".mod-settings .vertical-tab-content .setting-item:not(.setting-item-heading)",
  );
  assert.equal(declaration(card, "position"), "relative");
  assert.equal(declaration(card, "margin-block"), "0 var(--pixel-space-2)");
  assert.equal(declaration(card, "padding"), "var(--pixel-space-4)");
  assert.equal(
    declaration(card, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-settings-card-edge)",
  );
  assert.equal(declaration(card, "border-radius"), "var(--pixel-radius-large)");
  assert.equal(
    declaration(card, "background-color"),
    "var(--pixel-settings-card-surface)",
  );

  const nativeDivider = ruleBody(
    css,
    ".mod-settings .vertical-tab-content .setting-item:not(.setting-item-heading)::before",
  );
  assert.equal(declaration(nativeDivider, "content"), "none");
  assert.equal(declaration(nativeDivider, "display"), "none");
  assert.equal(declaration(nativeDivider, "border"), "0");

  const groupedCard = ruleBody(
    css,
    ".modal.mod-settings .vertical-tab-content .setting-group .setting-items > .setting-item:not(.setting-item-heading)",
  );
  assert.equal(
    declaration(groupedCard, "border-radius"),
    "var(--pixel-radius-large)",
  );

  const focusedCard = ruleBody(
    css,
    ".mod-settings .vertical-tab-content .setting-item:not(.setting-item-heading):focus-within",
  );
  assert.match(declaration(focusedCard, "box-shadow"), /inset 3px 0 0 var\(--pixel-cyan\)/);

  const reducedMotion = atRuleBody(css, "@media (prefers-reduced-motion: reduce)");
  const motionlessCard = ruleBodyForSelector(
    reducedMotion,
    ".mod-settings .vertical-tab-content .setting-item",
  );
  assert.equal(declaration(motionlessCard, "transition-duration"), "0ms");

  const heading = ruleBody(
    css,
    ".mod-settings .vertical-tab-content .setting-item.setting-item-heading",
  );
  assert.equal(declaration(heading, "background-color"), "transparent");
  assert.equal(declaration(heading, "border-inline"), "0");
});

test("the settings accent picker is a circular color well", async () => {
  const css = await readTheme();
  const picker = ruleBody(
    css,
    ".mod-settings .setting-item-control > input[type=color]",
  );

  assert.equal(declaration(picker, "box-sizing"), "border-box");
  assert.equal(declaration(picker, "inline-size"), "24px");
  assert.equal(declaration(picker, "block-size"), "24px");
  assert.equal(declaration(picker, "min-inline-size"), "24px");
  assert.equal(declaration(picker, "min-block-size"), "24px");
  assert.equal(declaration(picker, "padding"), "0");
  assert.equal(
    declaration(picker, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-settings-edge)",
  );
  assert.equal(declaration(picker, "border-radius"), "50%");
  assert.equal(
    declaration(picker, "background-color"),
    "transparent",
  );
  assert.equal(declaration(picker, "box-shadow"), "none");
  assert.match(declaration(picker, "transition"), /border-color/);
  assert.equal(declaration(picker, "overflow"), "hidden");
  assert.equal(declaration(picker, "cursor"), "pointer");

  const wrapper = ruleBody(
    css,
    ".mod-settings .setting-item-control > input[type=color]::-webkit-color-swatch-wrapper",
  );
  assert.equal(declaration(wrapper, "padding"), "0");
  assert.equal(declaration(wrapper, "border-radius"), "50%");

  const swatch = ruleBody(
    css,
    ".mod-settings .setting-item-control > input[type=color]::-webkit-color-swatch",
  );
  assert.equal(declaration(swatch, "border"), "0");
  assert.equal(declaration(swatch, "border-radius"), "50%");
});

test("core plugins use a quiet list with Pixel keycaps and search signal", async () => {
  const css = await readTheme();
  const list = ".mod-settings .mod-list";
  const toggleList = `body:not(.is-mobile) ${list}`;

  const scanSelector =
    ".setting-group-search .search-input-container::after";
  const scan = ruleBody(css, scanSelector);
  assert.equal(declaration(scan, "content"), "none");
  assert.equal(declaration(scan, "display"), "none");
  assert.doesNotMatch(css, /transform 300ms steps\(8\)/);
  assert.doesNotMatch(css, /\.setting-group-search :focus-within::after\s*\{[^}]*transform:/);

  const searchSelector = `${list} .setting-group-search input[type=search]`;
  const search = ruleBody(css, searchSelector);
  assert.equal(declaration(search, "min-block-size"), "36px");
  assert.equal(declaration(search, "border-radius"), "var(--pixel-radius)");
  assert.equal(
    declaration(search, "border"),
    "var(--pixel-border-decoration) solid var(--pixel-search-edge)",
  );
  assert.equal(declaration(search, "box-shadow"), "none");

  const focusedSearch = ruleBody(
    css,
    ".setting-group.mod-list.mod-list .setting-group-search :focus-within > input[type=search]",
  );
  assert.equal(declaration(focusedSearch, "outline"), "0");
  assert.equal(declaration(focusedSearch, "border-color"), "var(--pixel-cyan)");
  assert.equal(
    declaration(focusedSearch, "box-shadow"),
    "var(--pixel-search-focus-shadow)",
  );

  const rail = ruleBody(css, `${list} .setting-item-control`);

  assert.equal(declaration(rail, "min-block-size"), "var(--pixel-control-min)");
  assert.equal(declaration(rail, "flex"), "0 0 auto");
  assert.equal(declaration(rail, "gap"), "var(--pixel-space-2)");

  const action = ruleBody(css, `${list} .extra-setting-button`);
  assert.equal(declaration(action, "border-radius"), "var(--pixel-radius-small)");
  assert.equal(declaration(action, "transform"), "translatey(0)");
  assert.match(declaration(action, "box-shadow"), /inset 0 -2px 0/);

  const pressedAction = ruleBody(
    css,
    `${list} .extra-setting-button:not([aria-disabled=true]):active`,
  );
  assert.equal(declaration(pressedAction, "transform"), "translatey(1px)");

  const toggle = ruleBody(css, `${toggleList} .checkbox-container`);
  assert.equal(
    declaration(toggle, "--toggle-s-width"),
    "var(--pixel-toggle-inline-size)",
  );
  assert.equal(
    declaration(toggle, "--toggle-s-thumb-width"),
    "var(--pixel-toggle-thumb-size)",
  );
  assert.equal(
    declaration(toggle, "--toggle-s-thumb-height"),
    "var(--pixel-toggle-thumb-size)",
  );
  assert.equal(
    declaration(toggle, "inline-size"),
    "var(--pixel-toggle-inline-size)",
  );
  assert.equal(
    declaration(toggle, "block-size"),
    "var(--pixel-toggle-block-size)",
  );

  const thumb = ruleBody(css, `${toggleList} .checkbox-container::after`);
  assert.equal(
    declaration(thumb, "inline-size"),
    "var(--pixel-toggle-thumb-size)",
  );
  assert.equal(
    declaration(thumb, "block-size"),
    "var(--pixel-toggle-thumb-size)",
  );
  assert.equal(
    declaration(thumb, "inset-inline-start"),
    "var(--pixel-toggle-position)",
  );
  assert.equal(declaration(thumb, "top"), "0");
  assert.equal(declaration(thumb, "margin"), "0");
  assert.equal(declaration(thumb, "transform"), "scaley(1)");

  const enabledThumb = ruleBody(
    css,
    `${toggleList} .checkbox-container.is-enabled::after`,
  );
  assert.equal(declaration(enabledThumb, "transform"), "scaley(1)");

  const pressedThumb = ruleBody(
    css,
    `${toggleList} .checkbox-container:not(.is-disabled):active::after`,
  );
  assert.equal(declaration(pressedThumb, "transform"), "scaley(0.9)");
});

test("controls expose pointer, keyboard, and pressed feedback without layout shifts", async () => {
  const css = await readTheme();
  const raisedControl = ruleBodyForSelector(
    css,
    "button:not(.clickable-icon):not(.mod-settings *)",
  );
  assert.equal(
    declaration(raisedControl, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(raisedControl, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(raisedControl, "color"), "var(--pixel-text)");
  assert.equal(declaration(raisedControl, "box-shadow"), "var(--pixel-shadow-control)");
  assert.equal(declaration(raisedControl, "min-block-size"), "var(--pixel-control-min)");
  assert.match(
    declaration(raisedControl, "transition"),
    /transform var\(--pixel-motion-button\) var\(--pixel-ease-button\)/,
  );

  const roundedButton = ruleBody(
    css,
    "button:not(.clickable-icon):not(.mod-settings *)",
  );
  assert.equal(
    declaration(roundedButton, "border-radius"),
    "var(--pixel-radius-button)",
  );
  assert.equal(
    declaration(roundedButton, "box-shadow"),
    "var(--pixel-shadow-button)",
  );
  assert.equal(declaration(roundedButton, "transform"), "translatey(0)");

  const panelButton = ruleBody(
    css,
    ".clickable-icon:not(.mod-settings *)",
  );
  assert.equal(declaration(panelButton, "transform"), "translatey(0)");
  assert.match(
    declaration(panelButton, "transition"),
    /transform var\(--pixel-motion-button\) var\(--pixel-ease-button\)/,
  );
  assert.match(
    declaration(panelButton, "transition"),
    /background-size var\(--pixel-motion-state\) var\(--pixel-ease-out\)/,
  );

  const panelStateTrack = ruleBody(
    css,
    "body:not(.is-mobile) .workspace .clickable-icon:not(.mod-settings *)",
  );
  assert.equal(
    declaration(panelStateTrack, "background-image"),
    "linear-gradient(var(--pixel-cyan), var(--pixel-cyan))",
  );
  assert.equal(
    declaration(panelStateTrack, "background-position"),
    "center calc(100% - var(--pixel-space-1))",
  );
  assert.equal(
    declaration(panelStateTrack, "background-size"),
    "0 var(--pixel-border-control)",
  );

  const activePanelButton = ruleBody(
    css,
    'body:not(.is-mobile) .workspace .clickable-icon:not(.mod-settings *):is(.is-active, [aria-pressed=true]):not([aria-disabled=true])',
  );
  assert.equal(declaration(activePanelButton, "color"), "var(--pixel-cyan)");
  assert.equal(
    declaration(activePanelButton, "background-size"),
    "var(--pixel-space-3) var(--pixel-border-control)",
  );

  const pressedButton = ruleBodyForSelector(
    css,
    'button:not(.clickable-icon):not(.mod-settings *):not(:disabled):not([aria-disabled=true]):active',
  );
  assert.equal(declaration(pressedButton, "transform"), "translatey(1px)");
  assert.equal(
    declaration(pressedButton, "box-shadow"),
    "var(--pixel-shadow-button-active)",
  );

  const textField = ruleBodyForSelector(
    css,
    "input[type=text]:not(.mod-settings *)",
  );
  assert.equal(
    declaration(textField, "border"),
    "var(--pixel-border-control) solid var(--pixel-border-meaningful)",
  );
  assert.equal(declaration(textField, "background-color"), "var(--pixel-paper)");
  assert.equal(declaration(textField, "color"), "var(--pixel-text)");

  const pressed = ruleBodyForSelector(
    css,
    '.clickable-icon:not(.mod-settings *):not(:disabled):not([aria-disabled=true]):active',
  );
  assert.equal(declaration(pressed, "transform"), "translatey(1px)");
  assert.equal(declaration(pressed, "box-shadow"), "none");
  assert.equal(
    declaration(pressed, "transition-duration"),
    "var(--pixel-motion-press)",
  );

  const focus = ruleBodyForSelector(css, "button:focus-visible");
  assert.equal(
    declaration(focus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(focus, "outline-offset"), "2px");
  const fieldFocus = ruleBodyForSelector(
    css,
    "input[type=text]:not(.mod-settings *):focus-visible",
  );
  assert.equal(
    declaration(fieldFocus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  const sliderFocus = ruleBodyForSelector(css, "input[type=range]:focus-visible");
  assert.equal(
    declaration(sliderFocus, "outline"),
    "var(--pixel-border-control) solid var(--pixel-cyan)",
  );
  assert.equal(declaration(sliderFocus, "outline-offset"), "2px");

  const pointerHover = combinedAtRuleBody(
    css,
    "@media (hover: hover) and (pointer: fine)",
  );
  const hover = ruleBodyForSelector(
    pointerHover,
    ".clickable-icon:not(.mod-settings *):hover",
  );
  assert.equal(
    declaration(hover, "background-color"),
    "var(--pixel-surface-secondary)",
  );
  const liftedPanelButton = ruleBodyForSelector(
    pointerHover,
    '.clickable-icon:not(.mod-settings *):not(:disabled):not([aria-disabled=true]):not(:active):hover',
  );
  assert.equal(declaration(liftedPanelButton, "transform"), "translatey(-1px)");
  const buttonHover = ruleBodyForSelector(
    pointerHover,
    'button:not(.clickable-icon):not(.mod-settings *):not(:disabled):not([aria-disabled=true]):not(:active):hover',
  );
  assert.equal(declaration(buttonHover, "transform"), "translatey(-1px)");
  assert.equal(
    declaration(buttonHover, "box-shadow"),
    "var(--pixel-shadow-button-hover)",
  );
});

test("disabled, selected, warning, danger, loading, and empty states use multiple cues", async () => {
  const css = await readTheme();

  const disabled = ruleBodyForSelector(css, ".suggestion-item.is-disabled");
  assert.equal(declaration(disabled, "opacity"), "1");
  assert.equal(
    declaration(disabled, "background-color"),
    "var(--pixel-surface-secondary)",
  );
  assert.equal(declaration(disabled, "color"), "var(--pixel-text-muted)");
  assert.equal(declaration(disabled, "box-shadow"), "none");
  assert.equal(declaration(disabled, "cursor"), "not-allowed");

  const selected = ruleBodyForSelector(css, ".suggestion-item.is-selected");
  assert.equal(
    declaration(selected, "box-shadow"),
    "inset 3px 0 0 var(--pixel-cyan)",
  );
  assert.equal(
    declaration(selected, "background-color"),
    "color-mix(in srgb, var(--pixel-cyan) 10%, var(--pixel-paper))",
  );
  assert.equal(declaration(selected, "color"), "var(--pixel-text)");
  assert.equal(declaration(selected, "font-weight"), "600");

  const warning = ruleBodyForSelector(css, ".notice.mod-warning");
  assert.equal(
    declaration(warning, "border"),
    "var(--pixel-border-control) solid var(--pixel-amber-text)",
  );
  assert.equal(declaration(warning, "border-inline-start-width"), "4px");
  assert.equal(declaration(warning, "color"), "var(--pixel-amber-text)");

  const danger = ruleBodyForSelector(
    css,
    "button.mod-destructive:not(.mod-settings *)",
  );
  assert.equal(
    declaration(danger, "border"),
    "var(--pixel-border-decoration) solid color-mix(in srgb, var(--pixel-brick) 72%, var(--pixel-line))",
  );
  assert.equal(
    declaration(danger, "border-inline-start-width"),
    "var(--pixel-border-decoration)",
  );
  assert.equal(
    declaration(danger, "background-color"),
    "color-mix(in srgb, var(--pixel-brick) 10%, var(--pixel-paper))",
  );
  assert.equal(declaration(danger, "font-weight"), "650");
  assert.match(declaration(danger, "box-shadow"), /0 2px 0/);

  const dangerActive = ruleBody(
    css,
    "button.mod-destructive:not(.mod-settings *):not(:disabled):not([aria-disabled=true]):active",
  );
  assert.equal(
    declaration(dangerActive, "background-color"),
    "color-mix(in srgb, var(--pixel-brick) 22%, var(--pixel-paper))",
  );
  assert.equal(
    declaration(dangerActive, "transform"),
    "translatey(1px)",
  );

  const loading = ruleBody(css, ".is-loading");
  assert.equal(
    declaration(loading, "min-block-size"),
    "var(--pixel-state-min-block-size)",
  );
  assert.equal(declaration(loading, "color"), "var(--pixel-text)");
  assert.equal(declaration(loading, "cursor"), "progress");
  const loadingIndicator = ruleBody(css, ".is-loading::before");
  assert.equal(declaration(loadingIndicator, "animation"), "none");

  const loadingButton = ruleBody(css, "button.mod-loading:not(.mod-settings *)");
  assert.equal(declaration(loadingButton, "color"), "var(--pixel-text)");
  const loadingButtonIndicator = ruleBody(
    css,
    "button.mod-loading:not(.mod-settings *)::after",
  );
  assert.equal(declaration(loadingButtonIndicator, "display"), "none");

  const empty = ruleBodyForSelector(css, ".suggestion-empty");
  assert.equal(
    declaration(empty, "min-block-size"),
    "var(--pixel-state-min-block-size)",
  );
  assert.equal(declaration(empty, "color"), "var(--pixel-text-muted)");
});

test("accessibility preferences remove motion and preserve system-authoritative states", async () => {
  const css = await readTheme();

  const reducedMotion = atRuleBody(css, "@media (prefers-reduced-motion: reduce)");
  const motionlessControls = ruleBodyForSelector(reducedMotion, ".clickable-icon");
  assert.equal(declaration(motionlessControls, "transition-duration"), "0ms");
  assert.equal(declaration(motionlessControls, "animation"), "none");
  const motionlessToggleThumb = ruleBodyForSelector(
    reducedMotion,
    ".checkbox-container::after",
  );
  assert.equal(declaration(motionlessToggleThumb, "transition-duration"), "0ms");
  assert.equal(declaration(motionlessToggleThumb, "animation"), "none");
  const motionlessDrawers = ruleBodyForSelector(reducedMotion, ".workspace-drawer");
  assert.equal(declaration(motionlessDrawers, "transition-duration"), "0ms");
  assert.equal(declaration(motionlessDrawers, "animation"), "none");
  const motionlessCorePluginScan = ruleBodyForSelector(
    reducedMotion,
    ".setting-group-search .search-input-container::after",
  );
  assert.equal(
    declaration(motionlessCorePluginScan, "transition-duration"),
    "0ms",
  );
  assert.equal(declaration(motionlessCorePluginScan, "animation"), "none");

  const forcedColors = atRuleBody(css, "@media (forced-colors: active)");
  const systemRoles = ruleBodyForSelector(forcedColors, ".theme-light");
  assert.equal(declaration(systemRoles, "--pixel-canvas"), "canvas");
  assert.equal(declaration(systemRoles, "--pixel-paper"), "canvas");
  assert.equal(declaration(systemRoles, "--pixel-text"), "canvastext");
  assert.equal(declaration(systemRoles, "--pixel-text-muted"), "graytext");
  assert.equal(declaration(systemRoles, "--pixel-cyan"), "highlight");
  assert.equal(declaration(systemRoles, "--pixel-shadow-control"), "none");
  assert.equal(declaration(systemRoles, "--pixel-shadow-button"), "none");
  assert.equal(declaration(systemRoles, "--pixel-shadow-button-hover"), "none");
  assert.equal(declaration(systemRoles, "--pixel-shadow-button-active"), "none");
  assert.equal(declaration(systemRoles, "--pixel-shadow-shell"), "none");

  const forcedActivePanelButton = ruleBody(
    forcedColors,
    'body:not(.is-mobile) .workspace .clickable-icon:not(.mod-settings *):is(.is-active, [aria-pressed=true]):not([aria-disabled=true])',
  );
  assert.equal(
    declaration(forcedActivePanelButton, "outline"),
    "var(--pixel-border-control) solid highlight",
  );
  assert.equal(declaration(forcedActivePanelButton, "outline-offset"), "-4px");

  const highContrast = atRuleBody(css, "@media (prefers-contrast: more)");
  const strongerRoles = ruleBodyForSelector(highContrast, ".theme-light");
  assert.equal(
    declaration(strongerRoles, "--pixel-border-meaningful"),
    "var(--pixel-text)",
  );
  assert.equal(declaration(strongerRoles, "--pixel-line"), "var(--pixel-text-muted)");

  assert.doesNotMatch(css, /!important/);
  assert.doesNotMatch(css, /@keyframes/);
});


test("reduced motion zeros every shared duration and search clear feedback", async () => {
  const css = await readTheme();
  const defaults = ruleBody(css, "body");
  const reduced = atRuleBody(css, "@media (prefers-reduced-motion: reduce)");
  const preference = ruleBody(reduced, "body");
  const durations = [...defaults.matchAll(/(--pixel-motion-[\w-]+):/g)].map(match => match[1]);
  assert.ok(durations.length >= 7);
  for (const duration of durations) {
    assert.equal(declaration(preference, duration), "0ms", `${duration} must honor reduced motion`);
  }
  const clear = ruleBodyForSelector(reduced, ".search-input-clear-button");
  assert.equal(declaration(clear, "transition-duration"), "0ms");
  assert.equal(declaration(clear, "transition-delay"), "0ms");
});

test("disabled native controls resolve after semantic and mobile surface styles", async () => {
  const css = await readTheme();
  const selector = 'body button:not(.clickable-icon):not(.mod-settings *):is(:disabled, [aria-disabled=true])';
  const disabled = ruleBodyForSelector(css, ".suggestion-item.is-disabled");
  assert.equal(declaration(disabled, "transform"), "none");
  assert.equal(declaration(disabled, "box-shadow"), "none");
  assert.equal(declaration(disabled, "color"), "var(--pixel-text-muted)");
  assert.ok(css.indexOf(selector) > css.lastIndexOf("body.is-mobile button"));
  assert.ok(css.indexOf(selector) > css.lastIndexOf("button.mod-destructive"));
  const thumb = ruleBody(css, ".checkbox-container.is-disabled::after");
  assert.equal(declaration(thumb, "background-color"), "var(--pixel-surface-secondary)");
  assert.equal(declaration(thumb, "box-shadow"), "none");
});
