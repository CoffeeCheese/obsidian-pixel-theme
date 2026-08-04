# Pixel

Pixel is an independent Obsidian theme focused on long-form Markdown writing and knowledge management. Its confirmed production baseline combines the H5 material system, D1 balanced desktop layout, and M1 native dual-drawer mobile workspace.

The implemented production slices install the approved Light/Dark palette, 4px pixel geometry, reading typography, embedded identity/code fonts, shared controls, the H5/D1 desktop shell, complete cyan navigation and amber context docks, and a unified Markdown experience across Source, Live Preview, and Reading. Callouts, code, tables, embeds, media, attachments, footnotes, math, tasks, tags, and highlights share restrained Paper surfaces. Global and local Graph views use semantic cyan, amber, and brick renderer roles, while Canvas preserves native cards, groups, media, edges, selection, editing, menus, and spatial interaction on the cool-gray canvas. Bases keeps dense table, list, and card data editable with meaningful boundaries and no decorative shadows; PDF keeps its document canvas untouched while Pixel frames the toolbar, sidebar, pages, thumbnails, search, and selection states. On Obsidian mobile, M1 keeps the note persistent beneath the native cyan navigation and amber context drawers without replacing their interaction logic. Pixel does not replace native editing, scrolling, folding, navigation, drawers, SVG icons, or media controls.

## Design foundation

- Light and Dark use fixed semantic companions: cyan for navigation and focus, amber for context and emphasis, and brick for danger and power states.
- Long-form text uses a local/system Source Han and CJK fallback stack. Pixel does not bundle a CJK body font, so rare characters can continue through the operating system's natural font fallback.
- Fusion Pixel is reserved for the inline title and H1–H3 identity. JetBrains Mono Regular/Bold is reserved for code and technical state.
- The default reading measure is `72ch` at Obsidian's user-owned editor text size. Appearance settings can still override the theme font, text size, and accent color.
- Source, Live Preview, and Reading share heading rhythm, semantic link/emphasis/list roles, and visible selection, caret, active-line, folding, indentation, and task signals without adding vertical margins to editable blocks.

## Development

Requirements: Node.js 24 and npm.

```sh
npm ci
npm run build
npm test
npm run check
```

`src/scss/index.scss` is the only Sass entry point. Edit source modules under `src/`; do not edit the generated root `theme.css` directly.

For continuous compilation:

```sh
npm run dev
```

Before committing or preparing a release candidate, run the full sequence above from the lockfile. `npm run build` is the only command that writes the generated root stylesheet. `npm test` exercises the installed-package contracts and rejected release paths. `npm run check` is read-only and fails when the committed artifact differs from source.

### Dedicated Vault deployment

Copy `.env.example` to `.env` and set `OBSIDIAN_THEME_DIR` to the absolute, non-symlink Pixel theme directory inside the dedicated `dev-test` Vault. Then run:

```sh
OBSIDIAN_THEME_DIR=/absolute/path/to/dev-test/.obsidian/themes/Pixel npm run build
```

The trusted Vault ID lives in `development.json` and is resolved through Obsidian's system registry. Deployment atomically replaces only `theme.css` and `manifest.json`; it refuses relative, symlinked, mismatched-Vault, and out-of-scope destinations and does not delete other files.

See [COMPATIBILITY.md](COMPATIBILITY.md) for the authoritative component/accessibility matrix and [DEVICE_TEST_PLAN.md](DEVICE_TEST_PLAN.md) for the tester-operated physical iOS/Android release gate.

## Distribution contract

- `manifest.json` is the theme-version authority.
- `theme.css` is the only generated installable stylesheet.
- A user installs exactly `manifest.json` and `theme.css` in `.obsidian/themes/Pixel/`.
- `versions.json` maps each theme version to its minimum Obsidian version; Pixel `0.1.0` requires Obsidian `1.12.0`.
- Runtime assets must be embedded; remote font and image requests are rejected.
- Encoded fonts are capped at 1.2 MiB and generated CSS at 1.5 MiB.
- Release tags must exactly match `manifest.json.version`.
- The release workflow creates a draft containing only the two install files. It does not publish to the Obsidian community directory.

## Scope boundaries

- H5, D1, and M1 prototypes are visual/structural references only. Prototype markup, JavaScript state, simulated controls, screenshots, and Vault fixtures are not release assets.
- Pixel is a CSS theme, not a plugin. It does not inject DOM, register commands, replace platform gestures, or add synthetic drawer behavior.
- Community plugins that use documented Obsidian variables inherit Pixel naturally. The project ships no plugin-specific selectors and makes no individual plugin support promise.
- Screenshots, contrast captures, diagnostics, device records, and local Vault material remain ignored development evidence rather than tracked release files.

## Bundled fonts

Pixel embeds unmodified WOFF2 files from [Fusion Pixel 2026.07.20](https://github.com/TakWolf/fusion-pixel-font/releases/tag/2026.07.20) and [JetBrains Mono 2.304](https://github.com/JetBrains/JetBrainsMono/releases/tag/v2.304). Both are distributed under SIL Open Font License 1.1. Pinned checksums, attribution, and the complete license texts are stored in [`src/assets/fonts/`](src/assets/fonts/).

## License

Pixel's theme source is available under the [MIT License](LICENSE). Bundled font software remains under its accompanying SIL Open Font License 1.1.
