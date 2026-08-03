# Pixel

Pixel is an independent Obsidian theme focused on long-form Markdown writing and knowledge management. The visual baseline is the H5 material system with the D1 balanced desktop layout.

The implemented production slices install the approved Light/Dark palette, 4px pixel geometry, reading typography, embedded identity/code fonts, shared controls, the H5/D1 desktop shell, complete cyan navigation and amber context docks, and a unified Markdown experience across Source, Live Preview, and Reading. Callouts, code, tables, embeds, media, attachments, footnotes, math, tasks, tags, and highlights share restrained Paper surfaces. Global and local Graph views use semantic cyan, amber, and brick renderer roles, while Canvas preserves native cards, groups, media, edges, selection, editing, menus, and spatial interaction on the cool-gray canvas. Bases keeps dense table, list, and card data editable with meaningful boundaries and no decorative shadows; PDF keeps its document canvas untouched while Pixel frames the toolbar, sidebar, pages, thumbnails, search, and selection states. Pixel does not replace native editing, scrolling, folding, navigation, SVG icons, or media controls. The platform-invariant M1 mobile structure remains a separate implementation slice.

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
```

`src/scss/index.scss` is the only Sass entry point. Edit source modules under `src/`; do not edit the generated root `theme.css` directly.

For continuous compilation:

```sh
npm run dev
```

To deploy each build to the dedicated `dev-test` Vault, copy `.env.example` to `.env` and set `OBSIDIAN_THEME_DIR` to that Vault's absolute, non-symlink Pixel theme path. The trusted Vault ID lives in `development.json` and is resolved through Obsidian's system registry. Deployment replaces only `theme.css` and `manifest.json` using atomic per-file writes; it does not delete other files in the destination or write elsewhere in the Vault.

Before committing or releasing:

```sh
npm run check
```

This verifies the manifest and compatibility map, release tag when applicable, network-asset policy, CSS and encoded-font budgets, and that committed `theme.css` exactly matches the Sass source. Run `npm test` to exercise the valid and rejected package paths plus recoverable watch and safe deployment behavior.

## Distribution contract

- `manifest.json` is the theme-version authority.
- `theme.css` is the only generated installable stylesheet.
- Runtime assets must be embedded; remote font and image requests are rejected.
- Release tags must exactly match `manifest.json.version`.

## Bundled fonts

Pixel embeds unmodified WOFF2 files from [Fusion Pixel 2026.07.20](https://github.com/TakWolf/fusion-pixel-font/releases/tag/2026.07.20) and [JetBrains Mono 2.304](https://github.com/JetBrains/JetBrainsMono/releases/tag/v2.304). Both are distributed under SIL Open Font License 1.1. Pinned checksums, attribution, and the complete license texts are stored in [`src/assets/fonts/`](src/assets/fonts/).

## License

Pixel's theme source is available under the [MIT License](LICENSE). Bundled font software remains under its accompanying SIL Open Font License 1.1.
