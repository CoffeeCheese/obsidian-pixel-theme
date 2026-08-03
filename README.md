# Pixel

Pixel is an independent Obsidian theme focused on long-form Markdown writing and knowledge management. The visual baseline is the H5 material system with the D1 balanced desktop layout.

The bundled-font budget and complete mobile behavior are still design decisions. This repository currently contains the production-oriented engineering scaffold, not a release-ready theme.

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

To deploy each build to a dedicated theme folder in a test Vault, copy `.env.example` to `.env` and set `OBSIDIAN_THEME_DIR` to an absolute path. The build copies `theme.css` and `manifest.json` there.

Before committing or releasing:

```sh
npm run check
```

This verifies the manifest, release tag when applicable, network-asset policy, and that committed `theme.css` exactly matches the Sass source.

## Distribution contract

- `manifest.json` is the theme-version authority.
- `theme.css` is the only generated installable stylesheet.
- Runtime assets must be embedded; remote font and image requests are rejected.
- Release tags must exactly match `manifest.json.version`.

## License

Pixel is available under the [MIT License](LICENSE).
