<h1 align="center">P I X E L</h1>

<p align="right">English · <a href="README.zh-CN.md">中文</a></p>

<p align="center">
  <strong>Pixels on paper · Focused writing</strong><br>
  An Obsidian theme for long-form writing and knowledge management
</p>

<p align="center">
  <img src="src/assets/screenshots/pixel-status-rail.svg" width="352" alt="Pixel semantic color rail">
</p>

<p align="center">
  <kbd><!-- pixel-version:start -->0.9.0<!-- pixel-version:end --></kbd>
  <kbd>OBSIDIAN 1.12+</kbd>
  <kbd>LIGHT / DARK</kbd>
  <kbd>DESKTOP / iOS</kbd>
</p>

<p align="center">
  <a href="#preview">Preview</a> ·
  <a href="#features">Features</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#development">Development</a>
</p>

<p align="center">
  <img src="src/assets/screenshots/pixel-store-preview.png" alt="High-resolution Pixel theme preview with desktop Light, desktop Dark, and iOS surfaces" width="100%">
</p>

<p align="center"><sub>Desktop Light / Dark and iOS · Composed from real Obsidian captures</sub></p>

Pixel places content on a calm paper-like workspace and reserves its pixel typeface for headings and a few identity elements. It is not a retro filter: it preserves Obsidian's native interactions while giving navigation, reading, properties, and data views a clear and recognizable hierarchy.

The theme provides dedicated light and dark designs for desktop and iOS, with support for long Markdown documents, multilingual text, Bases, Canvas, Graph, and PDF workflows. Android is currently unverified and is not a supported platform claim.

## Preview

### Desktop · Light / Dark

The desktop layout uses a continuous Paper workspace: navigation lives on the left, the note remains spacious in the center, and cyan signals connect the active file, focus, and status.

<details>
<summary>Show the complete Light and Dark comparison</summary>

<table>
  <tr>
    <td align="center"><strong>LIGHT</strong></td>
    <td align="center"><strong>DARK</strong></td>
  </tr>
  <tr>
    <td><img src="src/assets/screenshots/pixel-desktop-light.png" alt="Pixel desktop Light theme"></td>
    <td><img src="src/assets/screenshots/pixel-desktop-dark.png" alt="Pixel desktop Dark theme"></td>
  </tr>
</table>

</details>

## Features

| Feature | Description |
| --- | --- |
| Pixel identity | Fusion Pixel gives note titles and H1–H3 a distinctive voice without tiring long-form reading. |
| Paper reading | A restrained surface hierarchy, readable body stack, and `72ch` default measure support focused writing. |
| Semantic color | Cyan marks navigation and focus, amber marks context and emphasis, and brick marks warning or danger. |
| Desktop workspace | Navigation, note, and context regions form one continuous and legible work surface. |
| iOS adaptation | Titles, lists, properties, drawers, and navigation are rebalanced for touch instead of merely shrinking desktop UI. |
| Native first | Pixel does not replace Obsidian's editing, folding, scrolling, gestures, drawers, icons, or media controls. |

## Visual language

- **Paper** for notes, menus, and primary reading surfaces.
- **Canvas** for the cool workspace around content.
- **Cyan** for the active file, links, caret, and keyboard focus.
- **Amber** for properties, context, and attention.
- **Brick** for errors, warnings, and destructive states.
- A **4 / 6 / 10px radius system** that balances pixel structure with comfortable touch UI.

Light and Dark use independently tuned semantic colors rather than simple inversion. Normal text, secondary text, focus indicators, and meaningful control boundaries are designed against accessible contrast targets.

## Covered Obsidian surfaces

### Markdown writing

- Consistent heading rhythm across Source, Live Preview, and Reading modes.
- Links, emphasis, lists, quotes, tasks, tags, highlights, and footnotes.
- Local overflow for code, tables, embeds, and media without compressing the full note.
- Clear selection, caret, active line, folding, and indentation states.

### Knowledge management

- File navigation, tags, search, bookmarks, outline, backlinks, and outgoing links.
- Note properties and property suggestions, including iOS editing states.
- Global and Local Graph controls and semantic states.
- Canvas cards, groups, media, edges, selection, and editing.
- Bases tables, lists, cards, filters, sorting, and property editing.
- PDF chrome, sidebar, thumbnails, search, and selection while preserving document pixels.

### Desktop and iOS

Desktop favors a continuous workspace and long reading sessions. iOS preserves Obsidian's native drawers, system navigation, virtual-keyboard resizing, and safe areas, with theme-owned touch targets of at least `44px`. Android has not completed physical-device validation.

The mobile structure is selected through Obsidian's native `body.is-mobile` state, never inferred from viewport width.

## Installation

Pixel entered public beta with `0.9.0`. Once the official directory review is complete:

1. Open **Settings → Appearance** in Obsidian.
2. Select **Manage** under Themes.
3. Search for **Pixel**, install it, and select **Use**.

Future public versions are delivered through Obsidian's built-in theme updater from matching GitHub Releases.

### Manual installation

1. Download [`manifest.json`](manifest.json) and [`theme.css`](theme.css).
2. Create `.obsidian/themes/Pixel/` in the target Vault.
3. Put both files in that directory.
4. Restart Obsidian if necessary, then select **Pixel** under Appearance.

For a synced Vault on iOS, wait for `.obsidian/themes/Pixel/` to finish syncing before restarting Obsidian. Android remains unverified.

## Customization

Pixel respects Obsidian's own appearance settings without requiring a companion plugin:

- Light or Dark mode
- Text and interface fonts
- Base font size
- Accent color

Pixel does not currently expose custom **Style Settings** controls. The Style Settings plugin is optional and is not required to install, use, or customize the theme.

The theme embeds Fusion Pixel for identity headings. Code and technical status use Obsidian's configured monospace font with system fallbacks, while body text uses the user's text font and operating-system fallback for uncommon characters.

Pixel ships no community-plugin-specific selectors. Plugins that use official Obsidian variables generally inherit the theme naturally, but individual community plugins are not compatibility commitments.

## Accessibility

- Normal text targets at least `4.5:1` contrast.
- Meaningful icons and control boundaries target at least `3:1` contrast.
- Keyboard focus uses outline, surface, and position cues instead of color alone.
- Reduced motion, forced colors, and increased contrast preferences are supported.
- User fonts, font sizes, accent, selection, and caret settings remain authoritative.
- Long text, code, and tables reflow or scroll locally instead of hiding content and controls.

## Compatibility

| Item | Current information |
| --- | --- |
| Current version | <code><!-- pixel-version:start -->0.9.0<!-- pixel-version:end --></code> |
| Obsidian requirement | `1.12.0` or newer |
| Verified desktop environment | Obsidian `1.13.4` / macOS |
| Mobile support | iOS |
| Not yet verified | Android |
| Appearance modes | Light / Dark |
| Installable files | `manifest.json`, `theme.css` |
| Theme license | MIT |
| Embedded font licenses | SIL Open Font License 1.1 |

## Development

Pixel requires Node.js 24 and npm:

```sh
npm ci
npm run build
npm test
npm run check
```

- `npm run build` compiles `theme.css` and optionally deploys to the dedicated development Vault.
- `npm run dev` watches Sass sources.
- `npm test` runs structural, compatibility, and release-contract tests.
- `npm run check` verifies that generated output matches the source without modifying it.

`src/scss/index.scss` is the only Sass entry point. Edit sources under `src/`; do not edit generated `theme.css` directly.

For guarded deployment, see [the Chinese development details](README.zh-CN.md#开发).

## Releasing

- `manifest.json` is the authoritative current version.
- `versions.json` permanently maps every published theme version to its minimum Obsidian version.
- Only an unprefixed `x.y.z` annotated tag triggers release CI.
- A verified release publishes only `theme.css` and `manifest.json`, with GitHub build provenance attestations.
- Public tags, Releases, and assets are immutable; regressions are fixed forward with a new PATCH.

See the complete [release and Obsidian community update guide](docs/RELEASING.md).

## Feedback

Use [GitHub Issues](https://github.com/CoffeeCheese/obsidian-pixel-theme/issues) for public feedback. Include Pixel and Obsidian versions, operating system, Light or Dark mode, reproduction steps, screenshots, and any enabled CSS snippets or community plugins.

## License

Pixel is released under the [MIT License](LICENSE). The embedded Fusion Pixel font retains its SIL Open Font License 1.1 terms; source, checksum, and license details are available under [`src/assets/fonts/`](src/assets/fonts/).
