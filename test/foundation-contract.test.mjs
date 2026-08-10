import assert from "node:assert/strict";
import test from "node:test";
import {
  combinedRuleBody,
  declaration,
  readTheme,
  ruleBody,
} from "../test-support/theme-css.mjs";

function relativeLuminance(hexColor) {
  const channels = hexColor
    .match(/[a-f\d]{2}/gi)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(firstColor, secondColor) {
  const luminances = [relativeLuminance(firstColor), relativeLuminance(secondColor)];
  const lighter = Math.max(...luminances);
  const darker = Math.min(...luminances);
  return (lighter + 0.05) / (darker + 0.05);
}

function hslToHex(hue, saturation, lightness) {
  const normalizedSaturation = saturation / 100;
  const normalizedLightness = lightness / 100;
  const chroma =
    (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation;
  const secondComponent = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const offset = normalizedLightness - chroma / 2;
  const channels =
    hue < 60
      ? [chroma, secondComponent, 0]
      : hue < 120
        ? [secondComponent, chroma, 0]
        : hue < 180
          ? [0, chroma, secondComponent]
          : hue < 240
            ? [0, secondComponent, chroma]
            : hue < 300
              ? [secondComponent, 0, chroma]
              : [chroma, 0, secondComponent];

  return `#${channels
    .map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

test("compiled package exposes the approved Pixel palette and geometry", async () => {
  const css = await readTheme();
  const body = ruleBody(css, "body");
  const light = ruleBody(css, ".theme-light");
  const dark = ruleBody(css, ".theme-dark");

  const expectedRoles = {
    light: {
      "--pixel-canvas": "#e8eef2",
      "--pixel-paper": "#f8fbfc",
      "--pixel-surface-secondary": "#dbe5eb",
      "--pixel-text": "#182434",
      "--pixel-text-muted": "#607184",
      "--pixel-cyan": "#197d8c",
      "--pixel-amber": "#d48732",
      "--pixel-brick": "#ae4e32",
      "--pixel-line": "#d2dde2",
      "--pixel-shadow-color": "#8fa5b2",
    },
    dark: {
      "--pixel-canvas": "#101821",
      "--pixel-paper": "#17232d",
      "--pixel-surface-secondary": "#20313c",
      "--pixel-text": "#e5edf0",
      "--pixel-text-muted": "#8fa2ad",
      "--pixel-cyan": "#58c7cf",
      "--pixel-amber": "#f0aa4f",
      "--pixel-brick": "#ef8b5d",
      "--pixel-line": "#2b3d47",
      "--pixel-shadow-color": "#091016",
    },
  };

  for (const [property, value] of Object.entries(expectedRoles.light)) {
    assert.equal(declaration(light, property), value);
  }
  for (const [property, value] of Object.entries(expectedRoles.dark)) {
    assert.equal(declaration(dark, property), value);
  }

  const expectedAccentDefaults = {
    light: { "--accent-h": "188", "--accent-s": "70%", "--accent-l": "32%" },
    dark: { "--accent-h": "184", "--accent-s": "55%", "--accent-l": "58%" },
  };
  for (const [property, value] of Object.entries(expectedAccentDefaults.light)) {
    assert.equal(declaration(light, property), value);
  }
  for (const [property, value] of Object.entries(expectedAccentDefaults.dark)) {
    assert.equal(declaration(dark, property), value);
  }

  const expectedGeometry = {
    "--pixel-space-1": "4px",
    "--pixel-space-2": "8px",
    "--pixel-space-3": "12px",
    "--pixel-space-4": "16px",
    "--pixel-space-6": "24px",
    "--pixel-space-8": "32px",
    "--pixel-space-12": "48px",
    "--pixel-border-decoration": "1px",
    "--pixel-border-control": "2px",
    "--pixel-border-shell": "3px",
    "--pixel-radius-small": "4px",
    "--pixel-radius": "6px",
    "--pixel-radius-large": "10px",
    "--pixel-radius-button": "12px",
    "--pixel-shadow-control": "2px 2px 0 var(--pixel-shadow-color)",
    "--pixel-shadow-shell": "4px 4px 0 var(--pixel-shadow-color)",
    "--pixel-ease-out": "cubic-bezier(0.2, 0.8, 0.2, 1)",
    "--pixel-ease-button": "cubic-bezier(0.22, 1, 0.36, 1)",
    "--pixel-ease-toggle": "cubic-bezier(0.42, 0, 0.25, 1)",
  };

  for (const [property, value] of Object.entries(expectedGeometry)) {
    assert.equal(declaration(body, property), value);
  }
});

test("compiled package maps Pixel roles through documented Obsidian variables", async () => {
  const css = await readTheme();
  const themeMapping = ruleBody(css, ".theme-light,\n.theme-dark");

  const expectedMappings = {
    "--background-primary": "var(--pixel-paper)",
    "--background-primary-alt": "var(--pixel-surface-secondary)",
    "--background-secondary": "var(--pixel-canvas)",
    "--background-secondary-alt": "var(--pixel-surface-secondary)",
    "--background-modifier-border": "var(--pixel-border-meaningful)",
    "--background-modifier-border-hover": "var(--pixel-cyan)",
    "--background-modifier-border-focus": "var(--pixel-cyan)",
    "--text-normal": "var(--pixel-text)",
    "--text-muted": "var(--pixel-text-muted)",
    "--text-accent": "hsl(var(--accent-h), var(--accent-s), var(--accent-l))",
    "--text-accent-hover":
      "hsl(var(--accent-h), var(--accent-s), calc(var(--accent-l) + var(--pixel-accent-hover-shift)))",
    "--text-error": "var(--pixel-brick)",
    "--divider-color": "var(--pixel-line)",
  };

  for (const [property, value] of Object.entries(expectedMappings)) {
    assert.equal(declaration(themeMapping, property), value);
  }
});

test("compiled package keeps text and meaningful boundaries above the accessibility floor", async () => {
  const css = await readTheme();

  for (const selector of [".theme-light", ".theme-dark"]) {
    const theme = ruleBody(css, selector);
    const paper = declaration(theme, "--pixel-paper");

    for (const property of [
      "--pixel-text",
      "--pixel-text-muted",
      "--pixel-border-meaningful",
      "--pixel-cyan",
      "--pixel-brick",
    ]) {
      assert.ok(
        contrastRatio(declaration(theme, property), paper) >= 4.5,
        `${selector} ${property} must reach 4.5:1 on Paper`,
      );
    }

    assert.ok(
      contrastRatio(declaration(theme, "--pixel-amber-text"), paper) >= 4.5,
      `${selector} warning text must not rely on the decorative amber role`,
    );

    const accentHue = Number(declaration(theme, "--accent-h"));
    const accentSaturation = Number.parseFloat(declaration(theme, "--accent-s"));
    const accentLightness = Number.parseFloat(declaration(theme, "--accent-l"));
    const accentHoverShift = Number.parseFloat(
      declaration(theme, "--pixel-accent-hover-shift"),
    );
    assert.ok(
      contrastRatio(
        hslToHex(accentHue, accentSaturation, accentLightness),
        paper,
      ) >= 4.5,
      `${selector} default accent text must reach 4.5:1 on Paper`,
    );
    assert.ok(
      contrastRatio(
        hslToHex(
          accentHue,
          accentSaturation,
          accentLightness + accentHoverShift,
        ),
        paper,
      ) >= 4.5,
      `${selector} default accent hover must reach 4.5:1 on Paper`,
    );
  }
});

test("compiled package embeds the approved identity and code fonts", async () => {
  const css = await readTheme();
  const fontFaces = [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map(
    (match) => match[1],
  );

  assert.equal(fontFaces.length, 3);
  assert.ok(
    fontFaces.some(
      (face) =>
        /font-family:\s*"Fusion Pixel 12 Proportional"/.test(face) &&
        /font-weight:\s*400/.test(face),
    ),
  );
  assert.ok(
    fontFaces.some(
      (face) =>
        /font-family:\s*"JetBrains Mono"/.test(face) &&
        /font-weight:\s*400/.test(face),
    ),
  );
  assert.ok(
    fontFaces.some(
      (face) =>
        /font-family:\s*"JetBrains Mono"/.test(face) &&
        /font-weight:\s*700/.test(face),
    ),
  );

  for (const face of fontFaces) {
    assert.match(face, /url\("data:font\/woff2;base64,[a-z\d+/=]+"\)/i);
    assert.match(face, /font-display:\s*swap/);
  }
  assert.doesNotMatch(css, /@font-face\s*\{[^}]*Source Han Sans/is);
});

test("compiled package assigns reading, identity, and code typography by role", async () => {
  const css = await readTheme();
  const body = combinedRuleBody(css, "body");

  assert.match(
    declaration(body, "--pixel-font-text"),
    /^"source han sans cn".*"pingfang sc".*"microsoft yahei".*system-ui.*sans-serif$/,
  );
  assert.equal(
    declaration(body, "--font-text-theme"),
    "var(--pixel-font-text)",
  );
  assert.equal(declaration(body, "--font-text-size"), "16px");
  assert.equal(declaration(body, "--line-height-normal"), "1.75");
  assert.equal(declaration(body, "--file-line-width"), "72ch");
  assert.equal(declaration(body, "--inline-title-font"), "var(--pixel-font-identity)");
  assert.equal(declaration(body, "--h1-font"), "var(--pixel-font-identity)");
  assert.equal(declaration(body, "--h2-font"), "var(--pixel-font-identity)");
  assert.equal(declaration(body, "--h3-font"), "var(--pixel-font-identity)");
  assert.equal(declaration(body, "--h4-font"), "var(--pixel-font-text)");
  assert.equal(declaration(body, "--h1-size"), "2em");
  assert.equal(declaration(body, "--h2-size"), "1.5em");
  assert.equal(declaration(body, "--h3-size"), "1.25em");
  assert.equal(declaration(body, "--code-size"), "0.9em");
});
