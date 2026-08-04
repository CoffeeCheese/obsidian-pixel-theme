# Pixel compatibility and accessibility matrix

This is the authoritative release-baseline matrix for Pixel. It records the installed-theme audit against Obsidian 1.12.7 on macOS, using the dedicated `dev-test` Vault. The runtime pass was performed in an isolated Obsidian profile at 1024×800; the package tests cover the same contracts without relying on that profile.

## Ticket 12 completion record

**Ticket status:** Complete

Ticket 12 was initially implemented by `25ee366`, then closed after a second specification and standards review found and corrected four gaps. The original committed-state audit used Node.js 24 and passed the locked install, one-shot build, 86-test suite, and generated-artifact check; the corrective pass adds regression contracts and is verified by the current full suite. The table below maps every acceptance gate to durable repository or installed-runtime evidence; later tickets may extend the evidence without changing this baseline result.

| Gate | Result | Evidence |
| --- | --- | --- |
| T12-01 | Pass | Component matrix below; `accessibility-compatibility-contract` surface coverage |
| T12-02 | Pass | Contrast contract below; Canvas/Bases link regression contracts; installed runtime compositing audit |
| T12-03 | Pass | Raw amber and decorative-line policy below; `controls-contract`; `accessibility-compatibility-contract` |
| T12-04 | Pass | Keyboard record below; `controls-contract`; direct-focus regression contracts; installed runtime forward and reverse traversal |
| T12-05 | Pass | `controls-contract` and the navigation, context, spatial, data-document, structured-content state suites |
| T12-06 | Pass | 200% text record below; installed runtime reflow, action-reachability, and local-overflow audit |
| T12-07 | Pass | Preference records below; reduced-motion and stronger-contrast regression contracts; installed runtime media emulation |
| T12-08 | Pass | `mobile-contract`; structural simulation of safe-area, 44×44px target, 8px gap, and native keyboard resizing |
| T12-09 | Pass | User-preference record below; `accessibility-compatibility-contract`; installed runtime restore check |
| T12-10 | Pass | Official-variable smoke record below; installed runtime inheritance check; selector source audit |
| T12-11 | Pass | Selector policy below; `accessibility-compatibility-contract`; spatial and structured-content cost guards |
| T12-12 | Pass | This tracked matrix; installed runtime Light, Dark, desktop, and structural mobile evidence |
| T12-13 | Pass | Initial and corrective failure records below; `navigation-contract`, `markdown-contract`, `accessibility-compatibility-contract`, `spatial-contract`, and `data-document-contract` |

## Component matrix

| Surface | Light | Dark | Keyboard and state | Zoom / overflow | Evidence |
| --- | --- | --- | --- | --- | --- |
| Workspace shell | Pass | Pass | Native tab and header order; shared 2px cyan focus ring | D1 remains scrollable at 200% text | `workspace-contract`, installed runtime |
| Navigation dock | Pass | Pass | Active, selected, hover, focus, empty, and badge cues checked | Long tree labels wrap; native pane scroll retained | `navigation-contract`, installed runtime |
| Note context dock | Pass | Pass | Property, outline, backlink, and outgoing-link focus/state checked | Long values wrap; pane scroll remains independent | `context-contract`, installed runtime |
| Source / Live Preview / Reading | Pass | Pass | Native editor behavior, selection, caret, and mode actions retained | Reading content reflows; code/table overflow remains local | `markdown-contract`, installed runtime |
| Native Markdown | Pass | Pass | Callout folding, links, tasks, media, embeds, and footnotes checked | Long code, tables, embeds, and media remain operable | `structured-content-contract`, installed runtime |
| Controls / overlays / settings | Pass | Pass | Tab traversal, menus, prompts, disabled/error/loading/empty states checked | Controls remain reachable; overlays retain native scrolling | `controls-contract`, installed runtime |
| Graph | Pass | Pass | Native settings and renderer interaction retained | Controls remain bounded and scrollable | `spatial-contract`, installed runtime |
| Canvas | Pass | Pass | Node selection/editing, menus, and control focus checked | Dense fixture pans/zooms without themed clipping | `spatial-contract`, installed runtime |
| Bases | Pass | Pass | Toolbar, table, card, editor, and selection behavior retained | Dense 64-row fixture keeps native two-axis scrolling | `data-document-contract`, installed runtime |
| PDF | Pass | Pass | Toolbar, page input, document accessibility layer, and thumbnail path checked | Multi-page document keeps native zoom and scroll | `data-document-contract`, installed runtime |
| D1 desktop / M1 mobile | Pass | Pass | Native drawers, backdrop dismissal, focus, and multi-cue active tabs retained | M1 uses 44×44px targets, 8px gaps, safe-area offset, native keyboard resizing | `workspace-contract`, `mobile-contract` |
| Official-variable plugin smoke | Pass | Pass | Native button and input remain focusable | Official surfaces inherit without plugin overrides | Isolated runtime DOM smoke |

## Contrast contract

Normal text is held to 4.5:1; meaningful icons and control boundaries are held to 3:1. Installed-theme DOM measurements include ancestor background compositing.

| Role / surface | Light minimum | Dark minimum | Contract |
| --- | ---: | ---: | --- |
| Primary text on Paper | 15.06:1 | 13.39:1 | Normal text |
| Muted text on Paper | 4.82:1 | 6.04:1 | Small secondary text |
| Cyan accent on Paper | 4.64:1 | 8.42:1 | Links, focus, meaningful icons |
| Amber text on secondary surface | 5.32:1 | 6.75:1 | Warning and syntax text |
| Meaningful boundary on Paper | 4.82:1 | 6.04:1 | Controls and state boundaries |

Raw amber is decorative and never used alone for small meaningful text. `--pixel-amber-text` carries warning content. `--pixel-line` is decorative and never the sole boundary of a control; `--pixel-border-meaningful` carries control and state boundaries. Disabled controls are explicitly disabled, use muted text plus a surface/border/cursor change, and are not counted as enabled normal text.

The initial audit found and fixed four baseline failures: Light navigation file badges were 3.92:1, Light tags were 3.87:1, the Live Preview code-language flair was 3.92:1, and native fenced-code syntax ranged from 1.63:1 to 3.92:1 on the secondary code surface. Badges and tags now use Paper, while the language flair and every syntax role use accessible text or amber-text roles. The post-fix runtime minimums are 4.82:1 for badges, 4.64:1 for tags, 12.25:1 for the Light language flair, and 5.32:1 for colored syntax in Light; Dark also passes.

The corrective review then found two cross-surface link failures that the initial matrix had missed: a Canvas Light tinted-node link at 4.35:1 and a Bases Light hovered link at 3.87:1. Canvas node content and Bases views now map native link roles to primary text. The follow-up runtime minimums are 13.78:1 Light / 11.43:1 Dark for Canvas and 12.25:1 Light / 11.31:1 Dark for Bases. Dedicated spatial and data-document contracts prevent those local native variables from regressing.

PDF page pixels and its transparent accessibility text layer reproduce the source document and are not recolored by the theme. PDF chrome, controls, boundaries, selection, and surrounding surfaces are in scope and pass.

## Interaction, zoom, and preference evidence

- Keyboard: installed traversal reached header actions, PDF page input, document accessibility nodes, menus, and shared controls with no trap. Interactive controls receive a 2px cyan outline at 2px offset; the corrective review explicitly extended that ring to reading links, tags, native tab-list regions, and navigation file regions. Keyboard-selected menu/suggestion rows receive the same ring plus surface, inset bar, and weight cues. Escape and reverse traversal remain native.
- 200% text: the 32px installed note audit retained all header actions, a usable vertical reading scroller, wrapping prose, and local overflow for code/tables. No meaningful clipped text, lost actions, destructive overlap, or unusable scroll region was found. Obsidian's user setting itself was also verified up to its 30px UI cap.
- User preferences: changing the isolated profile to a 30px body font, `Courier New`, and `#7b2cbf` updated Obsidian's inline `--font-text-size`, `--font-text-override`, and accent variables; restoring the values returned the profile to defaults. Pixel maps theme defaults and does not replace those authoritative runtime variables, selection, caret, or editor behavior.
- Reduced motion: CDP media emulation returned `0s` transition duration for shared buttons and PDF chrome. The corrective pass also matches the more-specific desktop resize-handle rule, so its transition resolves to `0s`; non-essential animation is removed.
- Forced colors: CDP media emulation resolved Paper/Text/Accent to `Canvas` / `CanvasText` / `Highlight`, and enabled controls measured 21:1 in the emulated palette.
- Increased contrast: CDP media emulation resolves both meaningful boundaries and muted text to primary text without changing the D1 or M1 body structure. The same media query strengthens M1 boundaries without changing layout.
- Mobile: M1 is keyed to Obsidian's native `body.is-mobile` platform state, not viewport width. Obsidian 1.12.7 structural simulation at 390×844 measured 343.195px native drawers with 3px cyan/amber tracks, a persistent 390px note, a 390×844 interactive scrim, a 56px top bar, and a 56px bottom navbar plus 34px safe-area inset. Theme-owned targets measured at least 44×56px with 8px separation; backdrop click, Enter, Escape, system-back simulation, focus return, navigation/history, reading/editing, and native viewport resizing remained operable. This is structural mobile evidence only; physical iOS/Android approval belongs to the release-candidate gate rather than Ticket 12.

## Compatibility and performance controls

The smoke plugin used only documented Obsidian variables (`--background-primary`, `--text-normal`, `--background-modifier-border`, `--border-width`) plus native button/input elements. In Light it inherited 15.06:1 text and 4.82:1 boundaries; no Pixel selector referenced its marker. The theme makes no community-plugin support claim.

The selector audit contains no `!important`, no `@keyframes`, no plugin-specific selector, and no Live Preview margin override. Relational selectors are limited to two justified native defects:

- an empty callout SVG fallback, needed because the native icon may render as an empty SVG;
- mobile drawer offset cancellation, needed because Obsidian applies inline transforms while an unpinned native drawer is open.

No decorative animation or expensive visual filter is shipped. The final installed surface had 4,577 DOM nodes, seven stylesheets, no recorded long task during the audit window, about 49.4 MB used JS heap, and an empty captured error/warning buffer. The generated CSS is 1,197,503 bytes, remains below the 1.5 MiB package gate, has no runtime network asset, and passes deterministic build checks.

## Verification command

```sh
npm test
npm run check
```

Runtime evidence is intentionally reproducible from the repository fixtures and the dedicated `dev-test` Vault; it does not depend on or modify a personal Vault.
